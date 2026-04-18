import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Admin-only: approve or reject an affiliate application.
// Gatekept by ADMIN_USER_IDS env (comma-separated UUIDs).
function isAdmin(userId: string): boolean {
  const list = (process.env.ADMIN_USER_IDS ?? "").split(",").map((s: string) => s.trim()).filter(Boolean);
  return list.includes(userId);
}

function generateCode(fullName: string): string {
  const base = fullName
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 6) || "AFF";
  const suffix = Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4);
  return `${base}${suffix}`;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin(user.id)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { application_id, decision } = body as {
    application_id?: string;
    decision?: "approved" | "rejected";
  };

  if (!application_id || !decision) {
    return NextResponse.json({ error: "application_id and decision required" }, { status: 400 });
  }
  if (decision !== "approved" && decision !== "rejected") {
    return NextResponse.json({ error: "decision must be 'approved' or 'rejected'" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: app, error: fetchErr } = await admin
    .from("affiliate_applications")
    .select("*")
    .eq("id", application_id)
    .single();

  if (fetchErr || !app) return NextResponse.json({ error: "Application not found" }, { status: 404 });
  if (app.status !== "pending") {
    return NextResponse.json({ error: `Ya ${app.status}` }, { status: 409 });
  }

  await admin
    .from("affiliate_applications")
    .update({
      status: decision,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", application_id);

  if (decision === "rejected") {
    return NextResponse.json({ success: true, decision });
  }

  // Approved: create affiliate row with unique code
  let code = "";
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = generateCode(app.full_name);
    const { data: existing } = await admin
      .from("affiliates")
      .select("id")
      .eq("code", candidate)
      .maybeSingle();
    if (!existing) { code = candidate; break; }
  }
  if (!code) {
    return NextResponse.json({ error: "Could not generate unique code, try again" }, { status: 500 });
  }

  // Link to profile if one exists with the same email
  const { data: matchedProfile } = await admin
    .from("profiles")
    .select("id")
    .eq("email", app.email.toLowerCase())
    .maybeSingle();

  const { data: affiliate, error: affErr } = await admin
    .from("affiliates")
    .insert({
      profile_id:     matchedProfile?.id ?? null,
      application_id: app.id,
      code,
      email:          app.email,
      full_name:      app.full_name,
    })
    .select("*")
    .single();

  if (affErr) {
    console.error("affiliate create error:", affErr);
    return NextResponse.json({ error: affErr.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, decision, affiliate });
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin(user.id)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = createAdminClient();
  const { data } = await admin
    .from("affiliate_applications")
    .select("*")
    .order("created_at", { ascending: false });

  return NextResponse.json({ applications: data ?? [] });
}

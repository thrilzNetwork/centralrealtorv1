import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { sendEmail, leadNotificationEmail } from "@/lib/email";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      listingId,
      profileId,
      visitorName,
      visitorEmail,
      visitorPhone,
      message,
      type = "heart",
    } = body;

    if (!profileId) {
      return NextResponse.json({ error: "profileId required" }, { status: 400 });
    }

    // listingId is required only for heart actions
    if (type === "heart" && !listingId) {
      return NextResponse.json({ error: "listingId required for heart" }, { status: 400 });
    }

    // Validate email format if provided
    if (visitorEmail && !EMAIL_RE.test(visitorEmail)) {
      return NextResponse.json({ error: "Correo electrónico inválido" }, { status: 400 });
    }

    // Sanitize phone — strip everything except digits, +, -, spaces
    const cleanPhone = visitorPhone ? visitorPhone.replace(/[^\d+\-\s()]/g, "").trim() : null;

    const admin = createAdminClient();

    const insertPayload: Record<string, unknown> = {
      profile_id: profileId,
      visitor_name: visitorName ? String(visitorName).slice(0, 120) : null,
      visitor_email: visitorEmail ? String(visitorEmail).slice(0, 255).toLowerCase() : null,
      visitor_phone: cleanPhone,
      status: "nuevo",
    };

    // listing_id is optional (contact_form can come from homepage)
    if (listingId) insertPayload.listing_id = listingId;
    // Store message in notes field
    if (message) insertPayload.notes = message;

    const { data: lead, error: leadError } = await admin
      .from("leads")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert(insertPayload as any)
      .select()
      .single();

    if (leadError) {
      if (leadError.code === "23505") {
        return NextResponse.json({ success: true, duplicate: true });
      }
      return NextResponse.json({ error: leadError.message }, { status: 500 });
    }

    // Increment hearts on listing via RPC
    if (type === "heart" && listingId) {
      const { error: rpcError } = await admin.rpc("increment_listing_hearts", { listing_id: listingId });
      if (rpcError) console.error("increment_listing_hearts failed:", rpcError.message);
    }

    // ─── In-app notification ───
    await admin.from("notifications").insert({
      profile_id: profileId,
      lead_id: lead.id,
      type: type === "heart" ? "new_lead" : "contact_form",
      title:
        type === "heart"
          ? "Nueva persona guardó una propiedad"
          : "Nuevo mensaje de contacto",
      body: visitorEmail
        ? `${visitorName ?? "Visitante"} (${visitorEmail})`
        : (visitorName ?? "Visitante anónimo"),
    });

    // ─── Email notification via Resend (AWAITED so we know if it fails) ───
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://centralbolivia.com";
    const { data: profile } = await admin
      .from("profiles")
      .select("email")
      .eq("id", profileId)
      .single();

    if (profile?.email) {
      const propertyTitle = listingId
        ? (await admin.from("listings").select("title").eq("id", listingId).single()).data?.title
        : null;

      const { subject, html } = leadNotificationEmail({
        visitorName: visitorName ?? "Visitante",
        visitorEmail: visitorEmail ?? null,
        visitorPhone: cleanPhone,
        message: message ?? null,
        propertyTitle: propertyTitle ?? null,
        dashboardUrl: `${siteUrl}/dashboard/leads`,
      });

      // Fire in background but log errors
      sendEmail({ to: profile.email, subject, html }).catch((err) => {
        console.error("[LEADS] Email send failed:", err);
      });
    }

    return NextResponse.json({ success: true, leadId: lead.id });
  } catch (err) {
    console.error("leads route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  // Require authentication; the user can only read their own leads
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format");

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("leads")
    .select("*, listings(title, slug)")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (format === "csv") {
    const rows = [
      ["Nombre", "Email", "Teléfono", "Estado", "Propiedad", "Notas", "Fecha"].join(","),
      ...(data ?? []).map((l) =>
        [
          `"${l.visitor_name ?? ""}"`,
          `"${l.visitor_email ?? ""}"`,
          `"${l.visitor_phone ?? ""}"`,
          `"${l.status ?? ""}"`,
          `"${(l.listings as { title?: string } | null)?.title ?? ""}"`,
          `"${(l.notes ?? "").replace(/"/g, '""')}"`,
          `"${new Date(l.created_at).toLocaleDateString("es-BO")}"`,
        ].join(",")
      ),
    ].join("\n");

    return new Response(rows, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="leads-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  return NextResponse.json(data);
}

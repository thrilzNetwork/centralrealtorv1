import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: me } = await supabase.from("profiles").select("is_staff").eq("id", user.id).single();
  if (!me?.is_staff) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await request.json();
  const { message, status_change, attachments } = body as {
    message?: string;
    status_change?: string;
    attachments?: unknown[];
  };

  if (!message) return NextResponse.json({ error: "message required" }, { status: 400 });

  const admin = createAdminClient();

  if (status_change) {
    await admin.from("ad_requests").update({ status: status_change }).eq("id", id);
  }

  await admin.from("ad_request_updates").insert({
    request_id:    id,
    author_id:     user.id,
    message,
    status_change: status_change ?? null,
    attachments:   attachments ?? [],
  });

  return NextResponse.json({ success: true });
}

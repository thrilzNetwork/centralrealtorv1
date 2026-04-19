import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const { data: req, error } = await supabase
    .from("ad_requests")
    .select("*, listings(title, slug), profiles!ad_requests_assigned_staff_id_fkey(full_name)")
    .eq("id", id)
    .eq("profile_id", user.id)
    .single();

  if (error || !req) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: updates } = await supabase
    .from("ad_request_updates")
    .select("*, profiles(full_name)")
    .eq("request_id", id)
    .order("created_at", { ascending: true });

  return NextResponse.json({ request: req, updates: updates ?? [] });
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("instagram_user_id, facebook_page_id, tiktok_open_id")
    .eq("id", user.id)
    .single();

  return NextResponse.json({
    instagram: !!profile?.instagram_user_id,
    facebook: !!profile?.facebook_page_id,
    tiktok: !!profile?.tiktok_open_id,
  });
}

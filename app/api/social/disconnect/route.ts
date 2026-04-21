import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Platform = "instagram" | "facebook" | "tiktok";

const PLATFORM_COLUMNS: Record<Platform, string[]> = {
  instagram: ["instagram_user_id", "instagram_access_token"],
  facebook: ["facebook_page_id", "facebook_page_token"],
  tiktok: ["tiktok_open_id", "tiktok_access_token"],
};

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const platform = searchParams.get("platform") as Platform | null;

  if (!platform || !PLATFORM_COLUMNS[platform]) {
    return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const nullFields = Object.fromEntries(
    PLATFORM_COLUMNS[platform].map((col) => [col, null])
  );

  const { error } = await supabase
    .from("profiles")
    .update(nullFields)
    .eq("id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

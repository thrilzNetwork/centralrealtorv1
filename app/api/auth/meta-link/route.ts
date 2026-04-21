import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const appId = process.env.FACEBOOK_APP_ID;
  if (!appId) {
    const { origin } = new URL(request.url);
    return NextResponse.redirect(`${origin}/dashboard/marca?social=unavailable`);
  }

  const { origin } = new URL(request.url);
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL ?? origin}/api/auth/meta-callback`;
  const scope = [
    "pages_show_list",
    "pages_read_engagement",
    "pages_manage_posts",
    "instagram_basic",
    "instagram_content_publish",
  ].join(",");

  const url = new URL("https://www.facebook.com/v19.0/dialog/oauth");
  url.searchParams.set("client_id", appId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", scope);
  url.searchParams.set("state", user.id);
  url.searchParams.set("response_type", "code");

  return NextResponse.redirect(url.toString());
}

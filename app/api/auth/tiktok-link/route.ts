import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  if (!clientKey) {
    const { origin } = new URL(request.url);
    return NextResponse.redirect(`${origin}/dashboard/marca?social=unavailable`);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
  const redirectUri = `${appUrl}/api/auth/tiktok-callback`;

  const url = new URL("https://www.tiktok.com/v2/auth/authorize/");
  url.searchParams.set("client_key", clientKey);
  url.searchParams.set("scope", "user.info.basic,video.publish");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", user.id);

  return NextResponse.redirect(url.toString());
}

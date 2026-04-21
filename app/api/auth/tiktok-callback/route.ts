import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const userId = searchParams.get("state");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? origin;
  const fail = `${appUrl}/dashboard/marca?social=error`;

  if (!code || !userId) return NextResponse.redirect(fail);

  const clientKey = process.env.TIKTOK_CLIENT_KEY!;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET!;
  const redirectUri = `${appUrl}/api/auth/tiktok-callback`;

  try {
    const tokenRes = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_key: clientKey,
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.open_id || !tokenData.access_token) return NextResponse.redirect(fail);

    const admin = createAdminClient();
    await admin
      .from("profiles")
      .update({
        tiktok_open_id: tokenData.open_id as string,
        tiktok_access_token: tokenData.access_token as string,
      })
      .eq("id", userId);

    return NextResponse.redirect(`${appUrl}/dashboard/marca?social=connected`);
  } catch {
    return NextResponse.redirect(fail);
  }
}

import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const GRAPH = "https://graph.facebook.com/v19.0";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const userId = searchParams.get("state");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? origin;
  const fail = `${appUrl}/dashboard/marca?social=error`;

  if (!code || !userId) return NextResponse.redirect(fail);

  const appId = process.env.FACEBOOK_APP_ID!;
  const appSecret = process.env.FACEBOOK_APP_SECRET!;
  const redirectUri = `${appUrl}/api/auth/meta-callback`;

  try {
    // 1. Short-lived user token
    const tokenRes = await fetch(
      `${GRAPH}/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${code}`
    );
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) return NextResponse.redirect(fail);
    const shortToken = tokenData.access_token as string;

    // 2. Long-lived user token (60 days)
    const longRes = await fetch(
      `${GRAPH}/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortToken}`
    );
    const longData = await longRes.json();
    const userToken = (longData.access_token as string) ?? shortToken;

    // 3. Get pages → take first page + long-lived page token
    const pagesRes = await fetch(
      `${GRAPH}/me/accounts?fields=id,name,access_token&access_token=${userToken}`
    );
    const pagesData = await pagesRes.json();
    const page = pagesData.data?.[0];
    if (!page) return NextResponse.redirect(fail);
    const pageId = page.id as string;
    const pageToken = page.access_token as string;

    // 4. Get Instagram Business Account linked to the page
    const igRes = await fetch(
      `${GRAPH}/${pageId}?fields=instagram_business_account&access_token=${pageToken}`
    );
    const igData = await igRes.json();
    const igUserId = (igData.instagram_business_account?.id as string) ?? null;

    // 5. Store in profiles
    const admin = createAdminClient();
    await admin
      .from("profiles")
      .update({
        instagram_user_id: igUserId,
        instagram_access_token: userToken,
        facebook_page_id: pageId,
        facebook_page_token: pageToken,
      })
      .eq("id", userId);

    return NextResponse.redirect(`${appUrl}/dashboard/marca?social=connected`);
  } catch {
    return NextResponse.redirect(fail);
  }
}

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Handles the OAuth callback after Google consent.
// Stores the provider_token (refresh token) in profiles for Calendar + Gmail use.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/dashboard/perfil?google=error`);
  }

  const supabase = await createClient();
  const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !sessionData.session) {
    return NextResponse.redirect(`${origin}/dashboard/perfil?google=error`);
  }

  const userId = sessionData.session.user.id;
  const providerToken = sessionData.session.provider_token;          // access token
  const providerRefreshToken = sessionData.session.provider_refresh_token; // refresh token

  if (providerRefreshToken) {
    const admin = createAdminClient();
    await admin
      .from("profiles")
      .update({
        google_refresh_token: providerRefreshToken,
        google_calendar_id: "primary",
      })
      .eq("id", userId);
  }

  return NextResponse.redirect(`${origin}/dashboard/perfil?google=connected`);
}

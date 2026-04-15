import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Initiates Google OAuth with Calendar + Gmail scopes.
// Called from the post-onboarding step or profile settings.
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { origin } = new URL(request.url);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/api/auth/google-callback`,
      scopes: [
        "https://www.googleapis.com/auth/calendar",
        "https://www.googleapis.com/auth/gmail.send",
        "openid",
        "email",
        "profile",
      ].join(" "),
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error || !data.url) {
    return NextResponse.json({ error: error?.message ?? "OAuth error" }, { status: 500 });
  }

  return NextResponse.redirect(data.url);
}

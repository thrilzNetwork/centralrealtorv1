import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import { welcome } from "@/lib/email/templates";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data?.user) {
      const userId = data.user.id;
      const userEmail = data.user.email ?? null;
      const admin = createAdminClient();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profile } = await (admin.from("profiles") as any)
        .select("full_name, welcome_email_sent_at")
        .eq("id", userId)
        .single();

      const alreadySent = profile?.welcome_email_sent_at != null;
      if (userEmail && !alreadySent) {
        const siteUrl =
          process.env.NEXT_PUBLIC_SITE_URL ??
          process.env.NEXT_PUBLIC_APP_URL ??
          origin;
        const tpl = welcome({
          fullName: profile?.full_name ?? "",
          siteUrl,
        });
        sendEmail({
          to: userEmail,
          subject: tpl.subject,
          text: tpl.text,
          html: tpl.html,
        })
          .then((res) => {
            if (res.sent) {
              return (admin.from("profiles") as unknown as {
                update: (v: Record<string, unknown>) => {
                  eq: (col: string, val: string) => Promise<unknown>;
                };
              })
                .update({ welcome_email_sent_at: new Date().toISOString() })
                .eq("id", userId);
            }
          })
          .catch(() => {});
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}

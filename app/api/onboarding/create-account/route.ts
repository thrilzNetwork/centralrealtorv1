import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/utils/slugify";
import { sendEmail, welcomeEmail } from "@/lib/email";

/**
 * Server-side account creation using the admin API.
 * - No client-side rate limits
 * - email_confirm: true skips the confirmation email
 * - Creates the profile in the same request (no trigger dependency)
 * - Sends branded welcome email via Resend
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, fullName, brandName, whatsapp, theme } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Correo y contraseña son requeridos." }, { status: 400 });
    }

    const admin = createAdminClient();

    // ── 1. Create (or find) the auth user ──────────────────────────
    let userId: string;

    const { data: newUser, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      user_metadata: { full_name: fullName ?? "" },
      email_confirm: true, // skip email confirmation step
    });

    if (createError) {
      // User might already exist — find them
      if (createError.message.toLowerCase().includes("already") ||
          createError.message.toLowerCase().includes("exists")) {
        const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 1000 });
        const existing = users.find((u) => u.email === email);
        if (!existing) {
          return NextResponse.json({ error: "Correo ya registrado. Ve a /login para ingresar." }, { status: 409 });
        }
        userId = existing.id;
      } else {
        return NextResponse.json({ error: createError.message }, { status: 400 });
      }
    } else {
      userId = newUser.user.id;
    }

    // ── 2. Generate unique slug ─────────────────────────────────────
    const baseSlug = slugify(fullName || brandName || email.split("@")[0]);
    let finalSlug = baseSlug;
    let counter = 0;

    while (true) {
      const { data } = await admin.from("profiles").select("slug").eq("slug", finalSlug).maybeSingle();
      if (!data) break;
      // If the slug belongs to THIS user already, use it
      const { data: owner } = await admin.from("profiles").select("id").eq("slug", finalSlug).maybeSingle();
      if (owner?.id === userId) break;
      counter++;
      finalSlug = `${baseSlug}-${counter}`;
    }

    // ── 3. Upsert profile ───────────────────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: profileError } = await (admin.from("profiles") as any).upsert({
      id: userId,
      email,
      full_name: fullName ?? "",
      slug: finalSlug,
      whatsapp: whatsapp ?? null,
      theme: theme ?? "realtor-v1",
      onboarding_completed: true,
    });

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    // ── 4. Send welcome email (non-blocking) ─────────────────────────
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://centralbolivia.com";
    const { subject, html } = welcomeEmail({
      fullName: fullName ?? "Agente",
      brandName: brandName ?? null,
      slug: finalSlug,
      portalUrl: `${siteUrl}/${finalSlug}`,
      dashboardUrl: `${siteUrl}/dashboard`,
    });

    sendEmail({ to: email, subject, html }).catch((err) => {
      console.error("[ONBOARDING] Welcome email failed:", err);
    });

    return NextResponse.json({ userId, slug: finalSlug, success: true });
  } catch (err) {
    console.error("create-account error:", err);
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 });
  }
}

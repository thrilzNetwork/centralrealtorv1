import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, getAdminEmails } from "@/lib/email/send";
import {
  affiliateApplicationAck,
  affiliateApplicationAdmin,
} from "@/lib/email/templates";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { full_name, email, phone, audience_size, channels, message, social_links } = body;

    if (!full_name || !email) {
      return NextResponse.json({ error: "Nombre y email son requeridos." }, { status: 400 });
    }
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Email inválido." }, { status: 400 });
    }

    const admin = createAdminClient();

    const { data, error } = await admin
      .from("affiliate_applications")
      .insert({
        full_name:     String(full_name).slice(0, 120),
        email:         String(email).toLowerCase().slice(0, 255),
        phone:         phone ? String(phone).slice(0, 40) : null,
        audience_size: audience_size ? String(audience_size).slice(0, 120) : null,
        channels:      channels ? String(channels).slice(0, 500) : null,
        message:       message ? String(message).slice(0, 2000) : null,
        social_links:  social_links ? String(social_links).slice(0, 1000) : null,
      })
      .select("id")
      .single();

    if (error) {
      // Duplicate pending application
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Ya tienes una solicitud pendiente con este email." },
          { status: 409 }
        );
      }
      console.error("affiliate apply error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const ackTpl = affiliateApplicationAck({ fullName: String(full_name) });
    sendEmail({
      to: String(email),
      subject: ackTpl.subject,
      text: ackTpl.text,
      html: ackTpl.html,
    }).catch(() => {});

    const admins = getAdminEmails();
    if (admins.length > 0) {
      const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL ??
        process.env.NEXT_PUBLIC_APP_URL ??
        "https://centralbolivia.com";
      const adminTpl = affiliateApplicationAdmin({
        fullName: String(full_name),
        email: String(email),
        phone: phone ? String(phone) : null,
        audienceSize: audience_size ? String(audience_size) : null,
        channels: channels ? String(channels) : null,
        message: message ? String(message) : null,
        socialLinks: social_links ? String(social_links) : null,
        adminUrl: `${siteUrl}/dashboard/afiliados`,
      });
      sendEmail({
        to: admins,
        subject: adminTpl.subject,
        text: adminTpl.text,
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, id: data.id });
  } catch (err) {
    console.error("affiliate apply route error:", err);
    return NextResponse.json({ error: "Error al enviar solicitud." }, { status: 500 });
  }
}

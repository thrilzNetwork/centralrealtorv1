// Central Bolivia email service — lazy init so build doesn't fail without env var
import { Resend } from "resend";

const FROM_EMAIL = "Central Bolivia <notificaciones@centralbolivia.com>";
let resendInstance: Resend | null = null;
function getResend(): Resend {
  if (!resendInstance) resendInstance = new Resend(process.env.RESEND_API_KEY!);
  return resendInstance;
}

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailParams) {
  if (!process.env.RESEND_API_KEY) {
    console.error("[EMAIL] RESEND_API_KEY not configured");
    return { error: "Email service not configured", sent: false };
  }

  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(to)) {
    console.error(`[EMAIL] Invalid email: ${to}`);
    return { error: "Invalid recipient email", sent: false };
  }

  try {
    const result = await getResend().emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
      text: text ?? html.replace(/<[^>]*>/g, "").trim(),
    });

    if (result.error) {
      console.error("[EMAIL] Resend error:", result.error);
      return { error: result.error.message, sent: false };
    }

    console.log(`[EMAIL] Sent to ${to}: ${subject}`);
    return { id: result.data?.id, sent: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[EMAIL] Send error:", msg);
    return { error: msg, sent: false };
  }
}

// ── Templates ──

export function leadNotificationEmail({
  visitorName,
  visitorEmail,
  visitorPhone,
  message,
  propertyTitle,
  dashboardUrl,
}: {
  visitorName: string;
  visitorEmail?: string | null;
  visitorPhone?: string | null;
  message?: string | null;
  propertyTitle?: string | null;
  dashboardUrl: string;
}) {
  const subject = propertyTitle
    ? `Nuevo interesado en: ${propertyTitle}`
    : `Nuevo mensaje de contacto: ${visitorName}`;

  const html = `
    <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #fff;">
      <div style="border-bottom: 3px solid #FF7F11; padding-bottom: 16px; margin-bottom: 24px;">
        <h1 style="margin: 0; color: #262626; font-size: 20px;">Central Bolivia</h1>
        <p style="margin: 4px 0 0; color: #6B7565; font-size: 13px;">Nuevo lead recibido</p>
      </div>

      <div style="background: #F7F5EE; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
        <h2 style="margin: 0 0 12px; color: #262626; font-size: 18px;">👤 ${escapeHtml(visitorName)}</h2>
        ${visitorEmail ? `<p style="margin: 4px 0; color: #6B7565; font-size: 14px;">📧 ${escapeHtml(visitorEmail)}</p>` : ""}
        ${visitorPhone ? `<p style="margin: 4px 0; color: #6B7565; font-size: 14px;">📱 ${escapeHtml(visitorPhone)}</p>` : ""}
        ${propertyTitle ? `<p style="margin: 12px 0 0; padding-top: 12px; border-top: 1px solid #EAE7DC; color: #262626; font-size: 14px;"><strong>Propiedad:</strong> ${escapeHtml(propertyTitle)}</p>` : ""}
      </div>

      ${message ? `
      <div style="background: #fff; border: 1px solid #EAE7DC; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
        <p style="margin: 0; color: #262626; font-size: 14px; line-height: 1.6;">${escapeHtml(message).replace(/\n/g, "<br>")}</p>
      </div>
      ` : ""}

      <a href="${dashboardUrl}" style="display: inline-block; background: #FF7F11; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-size: 14px; font-weight: 600;">
        Ir al Panel de Leads →
      </a>

      <p style="margin-top: 24px; color: #ACBFA4; font-size: 12px;">
        Central Bolivia — Tu oficina nunca cierra.
      </p>
    </div>
  `;

  return { subject, html };
}

export function propertyPublishedEmail({
  title,
  address,
  price,
  currency,
  propertyUrl,
}: {
  title: string;
  address?: string | null;
  price?: number | null;
  currency?: string;
  propertyUrl: string;
}) {
  const priceFormatted = price
    ? new Intl.NumberFormat("es-BO", { style: "currency", currency: currency ?? "USD" }).format(price)
    : "Precio a consultar";

  const html = `
    <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #fff;">
      <div style="border-bottom: 3px solid #FF7F11; padding-bottom: 16px; margin-bottom: 24px;">
        <h1 style="margin: 0; color: #262626; font-size: 20px;">Central Bolivia</h1>
        <p style="margin: 4px 0 0; color: #6B7565; font-size: 13px;">Tu propiedad está publicada</p>
      </div>

      <div style="background: #F7F5EE; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
        <h2 style="margin: 0 0 8px; color: #262626; font-size: 18px;">🏠 ${escapeHtml(title)}</h2>
        ${address ? `<p style="margin: 4px 0; color: #6B7565; font-size: 14px;">📍 ${escapeHtml(address)}</p>` : ""}
        <p style="margin: 12px 0 0; color: #FF7F11; font-size: 20px; font-weight: 700;">${priceFormatted}</p>
      </div>

      <a href="${propertyUrl}" style="display: inline-block; background: #FF7F11; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-size: 14px; font-weight: 600;">
        Ver Publicación →
      </a>

      <p style="margin-top: 16px; color: #6B7565; font-size: 13px;">
        Los leads interesados recibirán notificaciones automáticas. Revisa tu panel periódicamente.
      </p>

      <p style="margin-top: 24px; color: #ACBFA4; font-size: 12px;">
        Central Bolivia — Tu oficina nunca cierra.
      </p>
    </div>
  `;

  return {
    subject: `Tu propiedad está publicada: ${title}`,
    html,
  };
}

function escapeHtml(text: string): string {
  const div = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
  return text.replace(/[&<>"']/g, (m) => div[m as keyof typeof div]);
}

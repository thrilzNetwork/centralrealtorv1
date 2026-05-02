type Tpl = { subject: string; text: string; html?: string };

const BRAND = "Central Bolivia";
const ORANGE = "#FF7F11";
const DARK = "#262626";

function shell(title: string, bodyHtml: string, ctaUrl?: string, ctaLabel?: string): string {
  const cta = ctaUrl && ctaLabel
    ? `<p style="margin:32px 0 0 0;"><a href="${ctaUrl}" style="background:${ORANGE};color:#fff;text-decoration:none;padding:12px 20px;border-radius:4px;font-weight:600;">${ctaLabel}</a></p>`
    : "";
  return `<!doctype html>
<html><body style="margin:0;padding:24px;background:#F7F5EE;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${DARK};line-height:1.5;">
  <div style="max-width:560px;margin:0 auto;background:#fff;padding:32px;border-radius:8px;border:1px solid #EAE7DC;">
    <div style="border-bottom:2px solid ${ORANGE};padding-bottom:12px;margin-bottom:24px;">
      <strong style="font-size:14px;letter-spacing:0.18em;text-transform:uppercase;color:${DARK};">${BRAND}</strong>
    </div>
    <h1 style="font-size:22px;margin:0 0 16px 0;color:${DARK};">${title}</h1>
    ${bodyHtml}
    ${cta}
    <p style="margin:32px 0 0 0;font-size:12px;color:#6B7565;">— El equipo de ${BRAND}</p>
  </div>
</body></html>`;
}

export function welcome(args: { fullName: string; siteUrl: string }): Tpl {
  const name = args.fullName?.trim() || "agente";
  return {
    subject: `Bienvenido a ${BRAND}, ${name}`,
    text: [
      `Hola ${name},`,
      "",
      `Tu cuenta en ${BRAND} ya está activa. Desde tu panel puedes publicar propiedades, recibir leads, automatizar respuestas con IA y conectar tu agenda.`,
      "",
      `Entra a tu panel: ${args.siteUrl}/dashboard`,
      "",
      `Si tienes preguntas, responde este correo.`,
      "",
      "— El equipo de Central Bolivia",
    ].join("\n"),
    html: shell(
      `Bienvenido a ${BRAND}`,
      `<p>Hola <strong>${name}</strong>,</p>
       <p>Tu cuenta ya está activa. Desde tu panel puedes publicar propiedades, recibir leads, automatizar respuestas con IA y conectar tu agenda.</p>
       <p>Si tienes preguntas, responde este correo.</p>`,
      `${args.siteUrl}/dashboard`,
      "Ir al panel",
    ),
  };
}

export function listingPublished(args: {
  title: string;
  publicUrl: string;
  dashboardUrl: string;
}): Tpl {
  return {
    subject: `Tu propiedad "${args.title}" ya está publicada`,
    text: [
      `Tu propiedad "${args.title}" ya está visible al público en ${BRAND}.`,
      "",
      `Enlace público: ${args.publicUrl}`,
      `Editar en tu panel: ${args.dashboardUrl}`,
      "",
      "Compártela en tus redes para empezar a recibir interesados.",
    ].join("\n"),
    html: shell(
      "Tu propiedad ya está publicada",
      `<p>La propiedad <strong>${args.title}</strong> ya está visible al público.</p>
       <p style="margin:16px 0;"><a href="${args.publicUrl}" style="color:${ORANGE};">${args.publicUrl}</a></p>
       <p>Compártela en tus redes para empezar a recibir interesados.</p>`,
      args.dashboardUrl,
      "Editar en mi panel",
    ),
  };
}

export function affiliateApplicationAck(args: { fullName: string }): Tpl {
  const name = args.fullName?.trim() || "";
  return {
    subject: `Recibimos tu solicitud de afiliado — ${BRAND}`,
    text: [
      `Hola ${name},`,
      "",
      `Recibimos tu solicitud para el programa de afiliados de ${BRAND}. La revisaremos en las próximas 24-48 horas y te avisaremos por correo.`,
      "",
      "— El equipo de Central Bolivia",
    ].join("\n"),
    html: shell(
      "Recibimos tu solicitud",
      `<p>Hola <strong>${name}</strong>,</p>
       <p>Recibimos tu solicitud para el programa de afiliados. La revisaremos en las próximas 24-48 horas y te avisaremos por correo.</p>`,
    ),
  };
}

export function affiliateApplicationAdmin(args: {
  fullName: string;
  email: string;
  phone: string | null;
  audienceSize: string | null;
  channels: string | null;
  message: string | null;
  socialLinks: string | null;
  adminUrl: string;
}): Tpl {
  const lines = [
    `Nueva solicitud de afiliado:`,
    "",
    `Nombre: ${args.fullName}`,
    `Email: ${args.email}`,
    args.phone ? `Teléfono: ${args.phone}` : null,
    args.audienceSize ? `Audiencia: ${args.audienceSize}` : null,
    args.channels ? `Canales: ${args.channels}` : null,
    args.socialLinks ? `Redes: ${args.socialLinks}` : null,
    args.message ? `Mensaje: ${args.message}` : null,
    "",
    `Revisa: ${args.adminUrl}`,
  ].filter(Boolean) as string[];
  return {
    subject: `[Afiliados] Nueva solicitud — ${args.fullName}`,
    text: lines.join("\n"),
  };
}

export function adsApplicationAck(args: { fullName: string }): Tpl {
  const name = args.fullName?.trim() || "";
  return {
    subject: `Recibimos tu solicitud de Ads Accelerator — ${BRAND}`,
    text: [
      `Hola ${name},`,
      "",
      `Recibimos tu solicitud para el programa Ads Accelerator. Nuestro equipo la revisará y te avisaremos por correo cuando esté lista.`,
      "",
      "— El equipo de Central Bolivia",
    ].join("\n"),
    html: shell(
      "Recibimos tu solicitud",
      `<p>Hola <strong>${name}</strong>,</p>
       <p>Recibimos tu solicitud para Ads Accelerator. Nuestro equipo la revisará y te avisaremos por correo cuando esté lista.</p>`,
    ),
  };
}

export function adsApplicationAdmin(args: {
  fullName: string;
  email: string;
  city: string;
  phone: string;
  adminUrl: string;
}): Tpl {
  return {
    subject: `[Ads] Nueva solicitud — ${args.fullName}`,
    text: [
      `Nueva solicitud Ads Accelerator:`,
      "",
      `Nombre: ${args.fullName}`,
      `Email: ${args.email}`,
      `Teléfono: ${args.phone}`,
      `Ciudad: ${args.city}`,
      "",
      `Revisa: ${args.adminUrl}`,
    ].join("\n"),
  };
}

export function contactFormAdmin(args: {
  name: string | null;
  phone: string | null;
  role: string | null;
  properties: string | null;
  challenge: string | null;
  source: string | null;
  score: string | null;
}): Tpl {
  const lines = [
    `Nueva consulta desde el chatbot del sitio:`,
    "",
    args.name ? `Nombre: ${args.name}` : null,
    args.phone ? `Teléfono: ${args.phone}` : null,
    args.role ? `Rol: ${args.role}` : null,
    args.properties ? `Propiedades: ${args.properties}` : null,
    args.challenge ? `Desafío: ${args.challenge}` : null,
    args.score ? `Score: ${args.score}` : null,
    args.source ? `Fuente: ${args.source}` : null,
  ].filter(Boolean) as string[];
  return {
    subject: `[Contacto] Nueva consulta${args.name ? ` — ${args.name}` : ""}`,
    text: lines.join("\n"),
  };
}

export function planActivated(args: { plan: string; manageUrl: string }): Tpl {
  return {
    subject: `Tu plan ${args.plan} está activo — ${BRAND}`,
    text: [
      `Tu suscripción al plan "${args.plan}" se activó correctamente.`,
      "",
      `Administra tu facturación: ${args.manageUrl}`,
      "",
      "Gracias por confiar en nosotros.",
    ].join("\n"),
    html: shell(
      `Tu plan ${args.plan} está activo`,
      `<p>Tu suscripción al plan <strong>${args.plan}</strong> se activó correctamente.</p>
       <p>Gracias por confiar en nosotros.</p>`,
      args.manageUrl,
      "Administrar facturación",
    ),
  };
}

export function planCancelled(args: { manageUrl: string }): Tpl {
  return {
    subject: `Tu suscripción fue cancelada — ${BRAND}`,
    text: [
      `Tu suscripción fue cancelada y tu cuenta regresó al plan básico.`,
      "",
      "Si fue un error, puedes reactivarla desde tu portal:",
      args.manageUrl,
    ].join("\n"),
    html: shell(
      "Tu suscripción fue cancelada",
      `<p>Tu suscripción fue cancelada y tu cuenta regresó al plan básico.</p>
       <p>Si fue un error, puedes reactivarla desde tu portal.</p>`,
      args.manageUrl,
      "Reactivar suscripción",
    ),
  };
}

export function paymentFailed(args: { updatePaymentUrl: string }): Tpl {
  return {
    subject: `No pudimos procesar tu pago — ${BRAND}`,
    text: [
      `No pudimos procesar el último pago de tu suscripción.`,
      "",
      `Para evitar interrupciones, actualiza tu método de pago:`,
      args.updatePaymentUrl,
    ].join("\n"),
    html: shell(
      "No pudimos procesar tu pago",
      `<p>No pudimos procesar el último pago de tu suscripción.</p>
       <p>Para evitar interrupciones, actualiza tu método de pago.</p>`,
      args.updatePaymentUrl,
      "Actualizar método de pago",
    ),
  };
}

export function walletTopup(args: {
  amountCents: number;
  dashboardUrl: string;
}): Tpl {
  const amount = `$${(args.amountCents / 100).toFixed(2)} USD`;
  return {
    subject: `Recarga confirmada — ${amount}`,
    text: [
      `Tu recarga de ${amount} fue acreditada a tu billetera.`,
      "",
      `Revisa tu saldo: ${args.dashboardUrl}`,
    ].join("\n"),
    html: shell(
      "Recarga confirmada",
      `<p>Tu recarga de <strong>${amount}</strong> fue acreditada a tu billetera.</p>`,
      args.dashboardUrl,
      "Ver mi saldo",
    ),
  };
}

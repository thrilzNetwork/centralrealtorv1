import { Resend } from "resend";

let client: Resend | null = null;

function getClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!client) client = new Resend(key);
  return client;
}

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
};

export type SendEmailResult = { sent: boolean; skipped?: string };

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const c = getClient();
  if (!c) return { sent: false, skipped: "RESEND_API_KEY not set" };

  const from =
    process.env.EMAIL_FROM ?? "Central Bolivia <noreply@centralbolivia.com>";

  try {
    const { error } = await c.emails.send({
      from,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
      replyTo: input.replyTo,
    });
    if (error) {
      console.error("sendEmail resend error:", error);
      return { sent: false, skipped: "send error" };
    }
    return { sent: true };
  } catch (err) {
    console.error("sendEmail failed:", err instanceof Error ? err.message : err);
    return { sent: false, skipped: "send error" };
  }
}

export function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAIL ?? "";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

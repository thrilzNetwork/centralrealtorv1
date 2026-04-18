import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const maxDuration = 15;

export async function POST(request: NextRequest) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WA_FROM; // e.g. "whatsapp:+14155238886"

  if (!accountSid || !authToken || !from) {
    return NextResponse.json({ skipped: true, reason: "Twilio not configured" });
  }

  const body = await request.json();
  const { profile_id, message } = body as { profile_id?: string; message?: string };
  if (!profile_id || !message) {
    return NextResponse.json({ error: "profile_id and message required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("whatsapp_number")
    .eq("id", profile_id)
    .single();

  const toRaw: string | null = profile?.whatsapp_number ?? null;
  if (!toRaw) {
    return NextResponse.json({ skipped: true, reason: "No WhatsApp number on profile" });
  }

  // Normalize to E.164 prefixed with "whatsapp:"
  const toNormalized = toRaw.startsWith("whatsapp:") ? toRaw : `whatsapp:${toRaw.replace(/\s+/g, "")}`;

  const params = new URLSearchParams({ From: from, To: toNormalized, Body: message });
  const resp = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    }
  );

  if (!resp.ok) {
    const errText = await resp.text();
    console.error("Twilio WA error:", resp.status, errText);
    return NextResponse.json({ error: `Twilio ${resp.status}` }, { status: 502 });
  }

  const data = await resp.json();
  return NextResponse.json({ sent: true, sid: data.sid });
}

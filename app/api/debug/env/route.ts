import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    resend_key_set: !!process.env.RESEND_API_KEY,
    resend_key_prefix: process.env.RESEND_API_KEY ? process.env.RESEND_API_KEY.slice(0, 7) : null,
    site_url: process.env.NEXT_PUBLIC_SITE_URL ?? "not set",
  });
}

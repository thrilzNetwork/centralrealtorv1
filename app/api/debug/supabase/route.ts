import { NextResponse } from "next/server";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "not set";
  // Only return hostname, not full URL with keys
  let hostname = "not set";
  try {
    hostname = new URL(url).hostname;
  } catch {}
  
  return NextResponse.json({
    supabase_hostname: hostname,
  });
}

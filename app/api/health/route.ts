import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type CheckResult = { ok: boolean; latency_ms?: number; error?: string };

async function checkSupabase(): Promise<CheckResult> {
  const start = Date.now();
  try {
    const admin = createAdminClient();
    const { error } = await admin.from("profiles").select("id", { count: "exact", head: true }).limit(1);
    if (error) return { ok: false, error: error.message, latency_ms: Date.now() - start };
    return { ok: true, latency_ms: Date.now() - start };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "unknown", latency_ms: Date.now() - start };
  }
}

export async function GET() {
  const supabase = await checkSupabase();

  const checks = { supabase };
  const ok = Object.values(checks).every((c) => c.ok);

  return NextResponse.json(
    {
      status: ok ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      uptime_sec: Math.floor(process.uptime()),
      checks,
    },
    { status: ok ? 200 : 503 }
  );
}

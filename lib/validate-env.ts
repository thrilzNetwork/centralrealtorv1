/**
 * Validates required environment variables at startup.
 * Called from instrumentation.ts on server boot.
 * Fails fast with a clear error instead of failing mid-request.
 */

type EnvSpec = {
  name: string;
  required: boolean;
  description: string;
};

const ENV_SPEC: EnvSpec[] = [
  // Supabase (required — everything breaks without these)
  { name: "NEXT_PUBLIC_SUPABASE_URL", required: true, description: "Supabase project URL" },
  { name: "NEXT_PUBLIC_SUPABASE_ANON_KEY", required: true, description: "Supabase anon key" },
  { name: "SUPABASE_SERVICE_ROLE_KEY", required: true, description: "Supabase service role (admin writes)" },

  // App URL (required — Stripe/WhatsApp callbacks need it)
  { name: "NEXT_PUBLIC_APP_URL", required: true, description: "Public app URL, e.g. https://centralbolivia.com" },

  // Stripe (required for subscriptions)
  { name: "STRIPE_SECRET_KEY", required: true, description: "Stripe server-side secret" },
  { name: "STRIPE_WEBHOOK_SECRET", required: true, description: "Stripe webhook signing secret" },
  { name: "STRIPE_PRICE_PROFESIONAL", required: true, description: "Stripe price ID for $49 plan" },
  { name: "STRIPE_PRICE_BROKER", required: true, description: "Stripe price ID for $69 plan" },

  // Gemini (required — chatbot, CM Digital, image enhance all depend on it)
  { name: "GEMINI_API_KEY", required: true, description: "Google Gemini API key" },

  // Optional — features degrade gracefully
  { name: "REPLICATE_API_TOKEN", required: false, description: "Replicate API (video generation)" },
  { name: "TWILIO_ACCOUNT_SID", required: false, description: "Twilio (WhatsApp notifications)" },
  { name: "TWILIO_AUTH_TOKEN", required: false, description: "Twilio (WhatsApp notifications)" },
  { name: "TWILIO_WA_FROM", required: false, description: "Twilio WhatsApp number, e.g. whatsapp:+14155238886" },
  { name: "GOOGLE_CLIENT_ID", required: false, description: "Google OAuth (Calendar + email)" },
  { name: "GOOGLE_CLIENT_SECRET", required: false, description: "Google OAuth secret" },
  { name: "CRON_SECRET", required: false, description: "Cron job auth token" },
  { name: "STAFF_WHATSAPP", required: false, description: "Staff WhatsApp number for ads queue pings" },
  { name: "ADMIN_USER_IDS", required: false, description: "Comma-separated admin user IDs" },
  { name: "STRIPE_PRICE_WEBSITE200", required: false, description: "Stripe price ID for website200 one-time plan" },
  { name: "NEXT_PUBLIC_ROOT_DOMAIN", required: false, description: "Root domain for tenant subdomains" },
  { name: "NEXT_PUBLIC_SITE_URL", required: false, description: "Canonical site URL for emails" },
  { name: "NEXT_PUBLIC_ADS_FEE_PERCENT", required: false, description: "Ads Accelerator management fee" },
  { name: "VERCEL_API_TOKEN", required: false, description: "Vercel API token (custom domain provisioning)" },
  { name: "VERCEL_PROJECT_ID", required: false, description: "Vercel project ID" },
  { name: "VERCEL_TEAM_ID", required: false, description: "Vercel team ID" },
];

export function validateEnv(): void {
  const missing: EnvSpec[] = [];
  const empty: EnvSpec[] = [];

  for (const spec of ENV_SPEC) {
    if (!spec.required) continue;
    const value = process.env[spec.name];
    if (value === undefined) {
      missing.push(spec);
    } else if (value.trim() === "") {
      empty.push(spec);
    }
  }

  if (missing.length === 0 && empty.length === 0) {
    return;
  }

  const lines = ["❌ Environment validation failed:"];
  if (missing.length > 0) {
    lines.push("  Missing:");
    for (const s of missing) lines.push(`    - ${s.name}: ${s.description}`);
  }
  if (empty.length > 0) {
    lines.push("  Empty (must be non-empty):");
    for (const s of empty) lines.push(`    - ${s.name}: ${s.description}`);
  }
  const msg = lines.join("\n");

  // In production, fail hard. In dev, warn loudly so local work isn't blocked.
  if (process.env.NODE_ENV === "production") {
    throw new Error(msg);
  } else {
    console.warn(msg);
  }
}

/** Read a required env var — throws if missing or empty. Use in place of process.env.X! */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(`Environment variable ${name} is not set`);
  }
  return value;
}

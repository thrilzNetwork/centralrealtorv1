import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe, getOrCreateCustomer } from "@/lib/stripe/client";

const AMOUNT_PRESETS = new Set([5000, 10000, 25000, 50000]); // cents

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("ads_access_status, email, full_name")
    .eq("id", user.id)
    .single();

  if (profile?.ads_access_status !== "approved") {
    return NextResponse.json({ error: "Acceso no aprobado para Ads Accelerator" }, { status: 403 });
  }

  const body = await request.json();
  const amount_cents = Number(body.amount_cents);

  // Accept presets or any custom amount between $20 and $2000
  if (!amount_cents || amount_cents < 2000 || amount_cents > 200000) {
    return NextResponse.json({ error: "Monto inválido (mín $20, máx $2000)" }, { status: 400 });
  }

  const customerId = await getOrCreateCustomer(profile.email, user.id);
  const origin = request.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "";

  const session = await getStripe().checkout.sessions.create({
    customer: customerId,
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: amount_cents,
          product_data: {
            name: "Recarga Wallet — Ads Accelerator",
            description: `Central Bolivia · Crédito para campañas publicitarias`,
          },
        },
      },
    ],
    metadata: {
      type: "wallet_topup",
      profile_id: user.id,
      amount_cents: String(amount_cents),
    },
    success_url: `${origin}/dashboard/ads?topup=success`,
    cancel_url:  `${origin}/dashboard/ads?topup=cancelled`,
  });

  return NextResponse.json({ url: session.url });
}

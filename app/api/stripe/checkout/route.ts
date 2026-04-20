import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe, getPriceId, ONE_TIME_PLANS, getOrCreateCustomer } from "@/lib/stripe/client";
import { requireEnv } from "@/lib/validate-env";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { plan } = await request.json();

    let priceId: string;
    try {
      priceId = getPriceId(plan);
    } catch {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id, full_name")
      .eq("id", user.id)
      .single();

    const customerId = profile?.stripe_customer_id
      ?? await getOrCreateCustomer(user.email!, user.id);

    // Save customer ID if new
    if (!profile?.stripe_customer_id) {
      await supabase
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);
    }

    const appUrl = requireEnv("NEXT_PUBLIC_APP_URL");
    const stripe = getStripe();
    const isOneTime = ONE_TIME_PLANS.has(plan);

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: isOneTime ? "payment" : "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/dashboard?upgraded=true`,
      cancel_url: `${appUrl}/dashboard/facturacion`,
      metadata: { profileId: user.id, plan },
      ...(isOneTime ? {} : {
        subscription_data: { metadata: { profileId: user.id, plan } },
      }),
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}

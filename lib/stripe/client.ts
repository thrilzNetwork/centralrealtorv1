import Stripe from "stripe";
import { requireEnv } from "@/lib/validate-env";

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    stripeInstance = new Stripe(requireEnv("STRIPE_SECRET_KEY"), {
      apiVersion: "2025-03-31.basil",
    });
  }
  return stripeInstance;
}

/**
 * Resolves a plan key to a Stripe price ID. Throws if the price ID is not
 * configured — better to fail loudly than hand an empty string to Stripe.
 */
export function getPriceId(plan: string): string {
  const map: Record<string, string | undefined> = {
    profesional: process.env.STRIPE_PRICE_PROFESIONAL,
    broker: process.env.STRIPE_PRICE_BROKER,
    website200: process.env.STRIPE_PRICE_WEBSITE200,
  };
  const priceId = map[plan];
  if (!priceId || priceId.trim() === "") {
    throw new Error(`Stripe price ID not configured for plan: ${plan}`);
  }
  return priceId;
}

export const PLAN_KEYS = ["profesional", "broker", "website200"] as const;

/** Plans billed once — checkout uses mode:"payment" instead of "subscription" */
export const ONE_TIME_PLANS = new Set(["website200"]);

export async function getOrCreateCustomer(
  email: string,
  profileId: string
): Promise<string> {
  const stripe = getStripe();
  const existing = await stripe.customers.search({
    query: `metadata["profileId"]:"${profileId}"`,
    limit: 1,
  });

  if (existing.data.length > 0) {
    return existing.data[0].id;
  }

  const customer = await stripe.customers.create({
    email,
    metadata: { profileId },
  });

  return customer.id;
}

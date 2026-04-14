import Stripe from "stripe";

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2025-03-31.basil",
    });
  }
  return stripeInstance;
}

export const PLAN_PRICES: Record<string, string> = {
  profesional: process.env.STRIPE_PRICE_PROFESIONAL ?? "",
  broker: process.env.STRIPE_PRICE_BROKER ?? "",
  website200: process.env.STRIPE_PRICE_WEBSITE200 ?? "",
};

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

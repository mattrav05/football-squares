import Stripe from "stripe";

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-12-15.clover",
      typescript: true,
    });
  }
  return stripeInstance;
}

export const GAME_CREATION_PRICE = 500; // $5.00 in cents

export async function createGamePaymentIntent(userId: string, gameId: string) {
  const paymentIntent = await getStripe().paymentIntents.create({
    amount: GAME_CREATION_PRICE,
    currency: "usd",
    metadata: {
      userId,
      gameId,
      type: "game_creation",
    },
  });

  return paymentIntent;
}

export async function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string
) {
  try {
    const event = getStripe().webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
    return event;
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return null;
  }
}

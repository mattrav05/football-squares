import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover",
  typescript: true,
});

export const GAME_CREATION_PRICE = 500; // $5.00 in cents

export async function createGamePaymentIntent(userId: string, gameId: string) {
  const paymentIntent = await stripe.paymentIntents.create({
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
    const event = stripe.webhooks.constructEvent(
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

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { message: "No signature" },
      { status: 400 }
    );
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return NextResponse.json(
      { message: "Invalid signature" },
      { status: 400 }
    );
  }

  switch (event.type) {
    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object;
      const { userId, gameId, type } = paymentIntent.metadata;

      if (type === "game_creation" && gameId) {
        // Activate the game
        await prisma.game.update({
          where: { id: gameId },
          data: {
            status: "OPEN",
            paidAt: new Date(),
          },
        });

        // Record payment
        await prisma.payment.create({
          data: {
            userId,
            gameId,
            amount: paymentIntent.amount / 100,
            status: "completed",
            stripeId: paymentIntent.id,
            completedAt: new Date(),
          },
        });
      }
      break;
    }

    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object;
      const { userId, gameId } = paymentIntent.metadata;

      // Record failed payment
      await prisma.payment.create({
        data: {
          userId,
          gameId,
          amount: paymentIntent.amount / 100,
          status: "failed",
          stripeId: paymentIntent.id,
        },
      });
      break;
    }
  }

  return NextResponse.json({ received: true });
}

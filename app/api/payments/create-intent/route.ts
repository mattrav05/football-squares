import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getStripe, GAME_CREATION_PRICE } from "@/lib/stripe";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { gameId } = body;

    if (!gameId) {
      return NextResponse.json(
        { message: "Game ID is required" },
        { status: 400 }
      );
    }

    const paymentIntent = await getStripe().paymentIntents.create({
      amount: GAME_CREATION_PRICE,
      currency: "usd",
      metadata: {
        userId: session.user.id,
        gameId,
        type: "game_creation",
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error("Error creating payment intent:", error);
    return NextResponse.json(
      { message: "Failed to create payment" },
      { status: 500 }
    );
  }
}

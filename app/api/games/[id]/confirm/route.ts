import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { confirmPaymentSchema } from "@/lib/validations";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = confirmPaymentSchema.safeParse({ ...body, gameId: id });

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { squareIds } = parsed.data;

    // Verify user is the game manager
    const game = await prisma.game.findUnique({
      where: { id, managerId: session.user.id },
    });

    if (!game) {
      return NextResponse.json(
        { message: "Game not found or you are not the manager" },
        { status: 404 }
      );
    }

    // Confirm the squares
    await prisma.square.updateMany({
      where: {
        id: { in: squareIds },
        gameId: id,
        status: "RESERVED",
      },
      data: {
        status: "CONFIRMED",
        confirmedAt: new Date(),
      },
    });

    // Get confirmed squares to send notification emails
    const confirmedSquares = await prisma.square.findMany({
      where: {
        id: { in: squareIds },
        gameId: id,
      },
      include: {
        player: { select: { id: true, name: true, email: true } },
      },
    });

    // TODO: Queue email notifications for confirmed players

    return NextResponse.json({
      message: `Confirmed ${squareIds.length} square(s)`,
      confirmedCount: confirmedSquares.length,
    });
  } catch (error) {
    console.error("Error confirming payments:", error);
    return NextResponse.json(
      { message: "Failed to confirm payments" },
      { status: 500 }
    );
  }
}

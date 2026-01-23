import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { selectSquareSchema } from "@/lib/validations";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const squares = await prisma.square.findMany({
      where: { gameId: id },
      include: {
        player: { select: { id: true, name: true } },
      },
      orderBy: [{ rowIndex: "asc" }, { colIndex: "asc" }],
    });

    return NextResponse.json(squares);
  } catch (error) {
    console.error("Error fetching squares:", error);
    return NextResponse.json(
      { message: "Failed to fetch squares" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = selectSquareSchema.safeParse({ ...body, gameId: id });

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { squares: selectedSquares } = parsed.data;

    // Get the game
    const game = await prisma.game.findUnique({
      where: { id },
      include: {
        squares: true,
      },
    });

    if (!game) {
      return NextResponse.json({ message: "Game not found" }, { status: 404 });
    }

    if (game.status === "LOCKED" || game.status === "COMPLETED") {
      return NextResponse.json(
        { message: "This game is locked" },
        { status: 400 }
      );
    }

    // Check if user is blocked
    const gamePlayer = await prisma.gamePlayer.findUnique({
      where: {
        gameId_userId: {
          gameId: id,
          userId: session.user.id,
        },
      },
    });

    if (gamePlayer?.blocked) {
      return NextResponse.json(
        { message: "You have been blocked from selecting squares in this game" },
        { status: 403 }
      );
    }

    // Check max squares per player
    const userCurrentSquares = game.squares.filter(
      (s) => s.playerId === session.user!.id && s.status !== "AVAILABLE"
    ).length;

    if (userCurrentSquares + selectedSquares.length > game.maxSquaresPerPlayer) {
      return NextResponse.json(
        { message: `Maximum ${game.maxSquaresPerPlayer} squares per player` },
        { status: 400 }
      );
    }

    // Verify all squares are available
    for (const sq of selectedSquares) {
      const existing = game.squares.find(
        (s) => s.rowIndex === sq.rowIndex && s.colIndex === sq.colIndex
      );
      if (!existing || existing.status !== "AVAILABLE") {
        return NextResponse.json(
          { message: "One or more squares are not available" },
          { status: 400 }
        );
      }
    }

    // Reserve the squares
    await prisma.square.updateMany({
      where: {
        gameId: id,
        OR: selectedSquares.map((sq) => ({
          rowIndex: sq.rowIndex,
          colIndex: sq.colIndex,
        })),
        status: "AVAILABLE",
      },
      data: {
        status: "RESERVED",
        playerId: session.user.id,
        reservedAt: new Date(),
      },
    });

    // Ensure user is a player in the game
    await prisma.gamePlayer.upsert({
      where: {
        gameId_userId: {
          gameId: id,
          userId: session.user.id,
        },
      },
      create: {
        gameId: id,
        userId: session.user.id,
        role: "PLAYER",
      },
      update: {},
    });

    // Return updated squares
    const updatedSquares = await prisma.square.findMany({
      where: { gameId: id },
      include: {
        player: { select: { id: true, name: true } },
      },
      orderBy: [{ rowIndex: "asc" }, { colIndex: "asc" }],
    });

    return NextResponse.json(updatedSquares);
  } catch (error) {
    console.error("Error selecting squares:", error);
    return NextResponse.json(
      { message: "Failed to select squares" },
      { status: 500 }
    );
  }
}

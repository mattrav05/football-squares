import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createGameSchema } from "@/lib/validations";
import { generateEntryCode } from "@/lib/utils";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const games = await prisma.game.findMany({
      where: {
        OR: [
          { managerId: session.user.id },
          { players: { some: { userId: session.user.id } } },
        ],
      },
      include: {
        manager: { select: { id: true, name: true } },
        _count: { select: { squares: true, players: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(games);
  } catch (error) {
    console.error("Error fetching games:", error);
    return NextResponse.json(
      { message: "Failed to fetch games" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createGameSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Generate unique entry code
    let entryCode = generateEntryCode();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await prisma.game.findUnique({
        where: { entryCode },
      });
      if (!existing) break;
      entryCode = generateEntryCode();
      attempts++;
    }

    // Create the game
    const game = await prisma.game.create({
      data: {
        name: data.name,
        gameDate: new Date(data.gameDate),
        teamHome: data.teamHome,
        teamAway: data.teamAway,
        pricePerSquare: data.pricePerSquare || null,
        payoutQ1: data.payoutQ1,
        payoutQ2: data.payoutQ2,
        payoutQ3: data.payoutQ3,
        payoutFinal: data.payoutFinal,
        reservationHours: data.reservationHours,
        autoReleaseEnabled: data.autoReleaseEnabled,
        maxSquaresPerPlayer: data.maxSquaresPerPlayer,
        colorPrimary: data.colorPrimary,
        colorSecondary: data.colorSecondary,
        entryCode,
        managerId: session.user.id,
        status: "OPEN", // Auto-open for now (would be DRAFT until payment in prod)
      },
    });

    // Initialize all 100 squares
    const squares = [];
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 10; col++) {
        squares.push({
          gameId: game.id,
          rowIndex: row,
          colIndex: col,
        });
      }
    }

    await prisma.square.createMany({ data: squares });

    // Add manager as a player
    await prisma.gamePlayer.create({
      data: {
        gameId: game.id,
        userId: session.user.id,
        role: "CO_MANAGER",
      },
    });

    return NextResponse.json(game, { status: 201 });
  } catch (error) {
    console.error("Error creating game:", error);
    return NextResponse.json(
      { message: "Failed to create game" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Update player role or release their squares
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { playerId, action, role } = body;

    // Verify user is the manager
    const game = await prisma.game.findUnique({
      where: { id, managerId: session.user.id },
    });

    if (!game) {
      return NextResponse.json(
        { message: "Game not found or you are not the manager" },
        { status: 404 }
      );
    }

    // Handle different actions
    if (action === "setRole" && role) {
      // Update player role
      await prisma.gamePlayer.updateMany({
        where: { gameId: id, userId: playerId },
        data: { role },
      });

      return NextResponse.json({ message: `Player role updated to ${role}` });
    }

    if (action === "releaseSquares") {
      // Release all reserved squares for this player
      const result = await prisma.square.updateMany({
        where: {
          gameId: id,
          playerId,
          status: "RESERVED",
        },
        data: {
          status: "AVAILABLE",
          playerId: null,
          reservedAt: null,
        },
      });

      return NextResponse.json({
        message: `Released ${result.count} square(s)`,
        releasedCount: result.count,
      });
    }

    if (action === "removePlayer") {
      // Release all their squares first
      await prisma.square.updateMany({
        where: {
          gameId: id,
          playerId,
        },
        data: {
          status: "AVAILABLE",
          playerId: null,
          reservedAt: null,
          confirmedAt: null,
        },
      });

      // Remove from game
      await prisma.gamePlayer.deleteMany({
        where: { gameId: id, userId: playerId },
      });

      return NextResponse.json({ message: "Player removed from game" });
    }

    return NextResponse.json({ message: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error managing player:", error);
    return NextResponse.json(
      { message: "Failed to manage player" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// This endpoint should be called by a cron job (e.g., every 15 minutes)
// Vercel Cron or Railway Cron can trigger this

export async function GET(request: Request) {
  // Verify cron secret for security
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    // Find all games that are OPEN and have auto-release enabled
    const openGames = await prisma.game.findMany({
      where: {
        status: "OPEN",
        autoReleaseEnabled: true,
      },
      select: { id: true, reservationHours: true },
    });

    let totalReleased = 0;

    for (const game of openGames) {
      const expirationThreshold = new Date(
        Date.now() - game.reservationHours * 60 * 60 * 1000
      );

      // Release expired reserved squares
      const result = await prisma.square.updateMany({
        where: {
          gameId: game.id,
          status: "RESERVED",
          reservedAt: { lt: expirationThreshold },
        },
        data: {
          status: "AVAILABLE",
          playerId: null,
          reservedAt: null,
        },
      });

      totalReleased += result.count;
    }

    return NextResponse.json({
      message: "Expired squares released",
      releasedCount: totalReleased,
      gamesChecked: openGames.length,
    });
  } catch (error) {
    console.error("Error releasing expired squares:", error);
    return NextResponse.json(
      { message: "Failed to release expired squares" },
      { status: 500 }
    );
  }
}

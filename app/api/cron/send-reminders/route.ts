import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendEmail, getPaymentReminderEmail } from "@/lib/email";

// This endpoint should be called by a cron job (e.g., every hour)
// Sends reminders for squares expiring in 6 hours

export async function GET(request: Request) {
  // Verify cron secret for security
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Find games with squares expiring in the next 6 hours
    const games = await prisma.game.findMany({
      where: { status: "OPEN" },
      include: {
        squares: {
          where: { status: "RESERVED" },
          include: {
            player: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    let emailsSent = 0;

    for (const game of games) {
      // Group by player
      const playerSquares = new Map<
        string,
        { player: { name: string; email: string }; squares: typeof game.squares }
      >();

      for (const square of game.squares) {
        if (!square.player || !square.reservedAt) continue;

        const expiresAt = new Date(
          new Date(square.reservedAt).getTime() +
            game.reservationHours * 60 * 60 * 1000
        );

        const hoursRemaining = Math.ceil(
          (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60)
        );

        // Only send reminders for squares expiring in 4-6 hours
        if (hoursRemaining > 6 || hoursRemaining < 4) continue;

        const existing = playerSquares.get(square.player.id);
        if (existing) {
          existing.squares.push(square);
        } else {
          playerSquares.set(square.player.id, {
            player: square.player,
            squares: [square],
          });
        }
      }

      // Send reminder emails
      for (const { player, squares } of playerSquares.values()) {
        const gameUrl = `${appUrl}/games/${game.id}`;
        const html = getPaymentReminderEmail(
          player.name,
          game.name,
          squares.length,
          6,
          gameUrl
        );

        try {
          await sendEmail({
            to: player.email,
            subject: `Payment Reminder: ${game.name}`,
            html,
          });
          emailsSent++;
        } catch (error) {
          console.error(`Failed to send reminder to ${player.email}:`, error);
        }
      }
    }

    return NextResponse.json({
      message: "Reminders sent",
      emailsSent,
      gamesChecked: games.length,
    });
  } catch (error) {
    console.error("Error sending reminders:", error);
    return NextResponse.json(
      { message: "Failed to send reminders" },
      { status: 500 }
    );
  }
}

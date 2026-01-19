import { NextResponse } from "next/server";
import {
  getPendingJobs,
  markJobProcessing,
  markJobCompleted,
  markJobFailed,
} from "@/lib/jobs";
import { sendEmail, getGameInviteEmail, getPaymentConfirmedEmail, getPaymentReminderEmail } from "@/lib/email";

// Process queued jobs
export async function GET(request: Request) {
  // Verify cron secret for security
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  try {
    const jobs = await getPendingJobs(10);
    let processed = 0;
    let failed = 0;

    for (const job of jobs) {
      await markJobProcessing(job.id);

      try {
        const payload = job.payload as Record<string, unknown>;

        switch (job.type) {
          case "SEND_INVITE_EMAIL": {
            const { email, gameName, managerName, gameCode } = payload as {
              email: string;
              gameName: string;
              managerName: string;
              gameCode: string;
            };
            const joinUrl = `${appUrl}/join/${gameCode}`;
            const html = getGameInviteEmail(gameName, managerName, joinUrl);
            await sendEmail({
              to: email,
              subject: `You're invited to ${gameName}!`,
              html,
            });
            break;
          }

          case "SEND_REMINDER_EMAIL": {
            const { email, playerName, gameName, squareCount, hoursRemaining, gameId } =
              payload as {
                email: string;
                playerName: string;
                gameName: string;
                squareCount: number;
                hoursRemaining: number;
                gameId: string;
              };
            const gameUrl = `${appUrl}/games/${gameId}`;
            const html = getPaymentReminderEmail(
              playerName,
              gameName,
              squareCount,
              hoursRemaining,
              gameUrl
            );
            await sendEmail({
              to: email,
              subject: `Payment Reminder: ${gameName}`,
              html,
            });
            break;
          }

          case "SEND_CONFIRMATION_EMAIL": {
            const { email, playerName, gameName, squareCount, gameId } = payload as {
              email: string;
              playerName: string;
              gameName: string;
              squareCount: number;
              gameId: string;
            };
            const gameUrl = `${appUrl}/games/${gameId}`;
            const html = getPaymentConfirmedEmail(
              playerName,
              gameName,
              squareCount,
              gameUrl
            );
            await sendEmail({
              to: email,
              subject: `Payment Confirmed: ${gameName}`,
              html,
            });
            break;
          }

          default:
            throw new Error(`Unknown job type: ${job.type}`);
        }

        await markJobCompleted(job.id);
        processed++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        await markJobFailed(job.id, errorMessage);
        failed++;
      }
    }

    return NextResponse.json({
      message: "Jobs processed",
      processed,
      failed,
      total: jobs.length,
    });
  } catch (error) {
    console.error("Error processing jobs:", error);
    return NextResponse.json(
      { message: "Failed to process jobs" },
      { status: 500 }
    );
  }
}

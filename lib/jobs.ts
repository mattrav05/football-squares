import { prisma } from "./db";
import { JobStatus, Prisma } from "@prisma/client";

export type JobType =
  | "SEND_INVITE_EMAIL"
  | "SEND_REMINDER_EMAIL"
  | "SEND_CONFIRMATION_EMAIL"
  | "RELEASE_EXPIRED_SQUARES";

interface CreateJobOptions {
  type: JobType;
  payload: Prisma.InputJsonValue;
  runAt?: Date;
  userId?: string;
}

export async function createJob({ type, payload, runAt, userId }: CreateJobOptions) {
  return prisma.job.create({
    data: {
      type,
      payload,
      runAt: runAt || new Date(),
      userId,
    },
  });
}

export async function getPendingJobs(limit = 10) {
  return prisma.job.findMany({
    where: {
      status: JobStatus.PENDING,
      runAt: { lte: new Date() },
      attempts: { lt: 3 },
    },
    orderBy: { runAt: "asc" },
    take: limit,
  });
}

export async function markJobProcessing(jobId: string) {
  return prisma.job.update({
    where: { id: jobId },
    data: {
      status: JobStatus.PROCESSING,
      attempts: { increment: 1 },
    },
  });
}

export async function markJobCompleted(jobId: string) {
  return prisma.job.update({
    where: { id: jobId },
    data: {
      status: JobStatus.COMPLETED,
      completedAt: new Date(),
    },
  });
}

export async function markJobFailed(jobId: string, error: string) {
  const job = await prisma.job.findUnique({ where: { id: jobId } });

  if (job && job.attempts >= job.maxAttempts) {
    return prisma.job.update({
      where: { id: jobId },
      data: {
        status: JobStatus.FAILED,
        error,
      },
    });
  }

  return prisma.job.update({
    where: { id: jobId },
    data: {
      status: JobStatus.PENDING,
      error,
    },
  });
}

export async function scheduleReminderEmails(gameId: string, hoursBeforeExpiry: number) {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: {
      squares: {
        where: { status: "RESERVED" },
        include: { player: true },
      },
    },
  });

  if (!game) return;

  const playerSquares = new Map<string, { email: string; name: string; count: number }>();

  for (const square of game.squares) {
    if (square.player && square.reservedAt) {
      const existing = playerSquares.get(square.playerId!);
      if (existing) {
        existing.count++;
      } else {
        playerSquares.set(square.playerId!, {
          email: square.player.email,
          name: square.player.name,
          count: 1,
        });
      }
    }
  }

  for (const [playerId, player] of playerSquares) {
    await createJob({
      type: "SEND_REMINDER_EMAIL",
      payload: {
        gameId,
        playerId,
        email: player.email,
        playerName: player.name,
        gameName: game.name,
        squareCount: player.count,
        hoursRemaining: hoursBeforeExpiry,
      },
      userId: playerId,
    });
  }
}

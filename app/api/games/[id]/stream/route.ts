import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Verify game exists and user has access
  const game = await prisma.game.findFirst({
    where: {
      id,
      OR: [
        { managerId: session.user.id },
        { players: { some: { userId: session.user.id } } },
      ],
    },
  });

  if (!game) {
    return new Response("Game not found", { status: 404 });
  }

  const encoder = new TextEncoder();
  let intervalId: NodeJS.Timeout | null = null;

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection message
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: "connected" })}\n\n`)
      );

      // Poll for updates every 3 seconds
      intervalId = setInterval(async () => {
        try {
          const squares = await prisma.square.findMany({
            where: { gameId: id },
            include: {
              player: { select: { id: true, name: true } },
            },
            orderBy: [{ rowIndex: "asc" }, { colIndex: "asc" }],
          });

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "squares_updated", squares })}\n\n`
            )
          );
        } catch (error) {
          console.error("SSE error:", error);
        }
      }, 3000);
    },
    cancel() {
      if (intervalId) {
        clearInterval(intervalId);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

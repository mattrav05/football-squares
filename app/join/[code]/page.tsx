import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LegalDisclaimer } from "@/components/shared/legal-disclaimer";
import { formatDate, formatCurrency } from "@/lib/utils";

interface JoinPageProps {
  params: Promise<{ code: string }>;
}

async function getGameByCode(code: string) {
  return prisma.game.findUnique({
    where: { entryCode: code },
    include: {
      manager: { select: { name: true } },
      _count: { select: { squares: true, players: true } },
      squares: true,
    },
  });
}

export default async function JoinPage({ params }: JoinPageProps) {
  const { code } = await params;
  const session = await auth();
  const game = await getGameByCode(code);

  if (!game) {
    return (
      <div className="container flex min-h-[60vh] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Game Not Found</CardTitle>
            <CardDescription>
              This game link is invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild>
              <Link href="/">Go Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = {
    available: game.squares.filter((s) => s.status === "AVAILABLE").length,
    total: 100,
  };

  // If user is logged in and already a player, redirect to game
  if (session?.user?.id) {
    const isPlayer = await prisma.gamePlayer.findUnique({
      where: {
        gameId_userId: {
          gameId: game.id,
          userId: session.user.id,
        },
      },
    });

    if (isPlayer) {
      redirect(`/games/${game.id}`);
    }
  }

  // Join game action
  async function joinGame() {
    "use server";

    const sess = await auth();
    if (!sess?.user?.id) {
      redirect(`/login?callbackUrl=/join/${code}`);
    }

    const gameData = await prisma.game.findUnique({
      where: { entryCode: code },
    });

    if (!gameData) {
      return;
    }

    await prisma.gamePlayer.upsert({
      where: {
        gameId_userId: {
          gameId: gameData.id,
          userId: sess.user.id,
        },
      },
      create: {
        gameId: gameData.id,
        userId: sess.user.id,
        role: "PLAYER",
      },
      update: {},
    });

    redirect(`/games/${gameData.id}`);
  }

  return (
    <div className="container py-8">
      <div className="mx-auto max-w-lg space-y-6">
        <LegalDisclaimer variant="prominent" />

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{game.name}</CardTitle>
            <CardDescription>
              {game.teamAway} @ {game.teamHome}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="rounded-lg bg-muted p-4">
                <p className="text-2xl font-bold">{stats.available}</p>
                <p className="text-sm text-muted-foreground">Squares Available</p>
              </div>
              <div className="rounded-lg bg-muted p-4">
                <p className="text-2xl font-bold">
                  {game.pricePerSquare
                    ? formatCurrency(Number(game.pricePerSquare))
                    : "Free"}
                </p>
                <p className="text-sm text-muted-foreground">Per Square</p>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Game Date</span>
                <span>{formatDate(game.gameDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Manager</span>
                <span>{game.manager.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className="capitalize">{game.status.toLowerCase()}</span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Payout Structure</p>
              <div className="grid grid-cols-4 gap-2 text-center text-sm">
                <div className="rounded bg-muted p-2">
                  <p className="font-medium">{game.payoutQ1}%</p>
                  <p className="text-xs text-muted-foreground">Q1</p>
                </div>
                <div className="rounded bg-muted p-2">
                  <p className="font-medium">{game.payoutQ2}%</p>
                  <p className="text-xs text-muted-foreground">Q2</p>
                </div>
                <div className="rounded bg-muted p-2">
                  <p className="font-medium">{game.payoutQ3}%</p>
                  <p className="text-xs text-muted-foreground">Q3</p>
                </div>
                <div className="rounded bg-muted p-2">
                  <p className="font-medium">{game.payoutFinal}%</p>
                  <p className="text-xs text-muted-foreground">Final</p>
                </div>
              </div>
            </div>

            {session?.user ? (
              <form action={joinGame}>
                <Button type="submit" className="w-full" size="lg">
                  Join Game & Pick Squares
                </Button>
              </form>
            ) : (
              <div className="space-y-2">
                <Button asChild className="w-full" size="lg">
                  <Link href={`/login?callbackUrl=/join/${code}`}>
                    Sign In to Join
                  </Link>
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  Don&apos;t have an account?{" "}
                  <Link
                    href={`/register?callbackUrl=/join/${code}`}
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    Sign up
                  </Link>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

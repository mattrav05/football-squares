import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LegalDisclaimer } from "@/components/shared/legal-disclaimer";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Calendar, Users, DollarSign, Trophy, Grid3X3, ArrowRight } from "lucide-react";

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

        <Card className="overflow-hidden">
          <div
            className="h-2"
            style={{
              background: `linear-gradient(to right, ${game.colorPrimary}, ${game.colorSecondary})`,
            }}
          />
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Grid3X3 className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">{game.name}</CardTitle>
            <CardDescription className="text-base">
              {game.teamHome} vs {game.teamAway}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <p className="text-2xl font-bold">{stats.available}</p>
                <p className="text-sm text-muted-foreground">Squares Available</p>
              </div>
              <div className="rounded-lg bg-green-500/5 border border-green-500/20 p-4">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <DollarSign className="h-4 w-4 text-green-600" />
                </div>
                <p className="text-2xl font-bold">
                  {game.pricePerSquare
                    ? formatCurrency(Number(game.pricePerSquare))
                    : "Free"}
                </p>
                <p className="text-sm text-muted-foreground">Per Square</p>
              </div>
            </div>

            <div className="space-y-3 rounded-lg bg-muted/50 p-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Game Date
                </span>
                <span className="font-medium">{formatDate(game.gameDate)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  Manager
                </span>
                <span className="font-medium">{game.manager.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Grid3X3 className="h-4 w-4" />
                  Status
                </span>
                <span className="font-medium capitalize">{game.status.toLowerCase()}</span>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium flex items-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-500" />
                Payout Structure
              </p>
              <div className="grid grid-cols-4 gap-2 text-center text-sm">
                <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-2">
                  <p className="font-bold">{game.payoutQ1}%</p>
                  <p className="text-xs text-muted-foreground">Q1</p>
                </div>
                <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-2">
                  <p className="font-bold">{game.payoutQ2}%</p>
                  <p className="text-xs text-muted-foreground">Q2</p>
                </div>
                <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-2">
                  <p className="font-bold">{game.payoutQ3}%</p>
                  <p className="text-xs text-muted-foreground">Q3</p>
                </div>
                <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-2">
                  <p className="font-bold">{game.payoutFinal}%</p>
                  <p className="text-xs text-muted-foreground">Final</p>
                </div>
              </div>
            </div>

            {session?.user ? (
              <form action={joinGame}>
                <Button type="submit" className="w-full h-12 text-base font-semibold" size="lg">
                  Join Game & Pick Squares
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </form>
            ) : (
              <div className="space-y-3">
                <Button asChild className="w-full h-12 text-base font-semibold" size="lg">
                  <Link href={`/login?callbackUrl=/join/${code}`}>
                    Sign In to Join
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  Don&apos;t have an account?{" "}
                  <Link
                    href={`/register?callbackUrl=/join/${code}`}
                    className="text-primary font-medium underline-offset-4 hover:underline"
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

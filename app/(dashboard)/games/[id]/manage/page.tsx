import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PendingConfirmations } from "@/components/dashboard/pending-confirmations";
import { PlayerManagement } from "@/components/dashboard/player-management";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { formatDate } from "@/lib/utils";
import { Grid3X3, CheckCircle, Clock, Users } from "lucide-react";

interface ManagePageProps {
  params: Promise<{ id: string }>;
}

async function getGameForManager(id: string, userId: string) {
  const game = await prisma.game.findUnique({
    where: { id, managerId: userId },
    include: {
      squares: {
        include: {
          player: { select: { id: true, name: true, email: true } },
        },
      },
      players: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  return game;
}

export default async function ManagePage({ params }: ManagePageProps) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const game = await getGameForManager(id, session.user.id);

  if (!game) {
    notFound();
  }

  const stats = {
    total: 100,
    available: game.squares.filter((s) => s.status === "AVAILABLE").length,
    reserved: game.squares.filter((s) => s.status === "RESERVED").length,
    confirmed: game.squares.filter((s) => s.status === "CONFIRMED").length,
  };

  // Group reserved squares by player
  const pendingByPlayer = new Map<
    string,
    { player: { id: string; name: string; email: string }; squares: typeof game.squares }
  >();

  for (const square of game.squares) {
    if (square.status === "RESERVED" && square.player) {
      const existing = pendingByPlayer.get(square.player.id);
      if (existing) {
        existing.squares.push(square);
      } else {
        pendingByPlayer.set(square.player.id, {
          player: square.player,
          squares: [square],
        });
      }
    }
  }

  const pendingPlayers = Array.from(pendingByPlayer.values());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Manage: {game.name}</h1>
          <p className="text-muted-foreground">
            {game.teamHome} vs {game.teamAway} • {formatDate(game.gameDate)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/games/${game.id}`}>View Grid</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/games/${game.id}/settings`}>Settings</Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="relative overflow-hidden">
          <div className="absolute right-2 top-2 h-8 w-8 rounded-full bg-muted flex items-center justify-center">
            <Grid3X3 className="h-4 w-4 text-muted-foreground" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Squares
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">in grid</p>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden">
          <div className="absolute right-2 top-2 h-8 w-8 rounded-full bg-muted flex items-center justify-center">
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Available
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.available}</p>
            <p className="text-xs text-muted-foreground">open to claim</p>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden border-yellow-200 dark:border-yellow-900">
          <div className="absolute right-2 top-2 h-8 w-8 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
            <Clock className="h-4 w-4 text-yellow-600" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Payment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-600">{stats.reserved}</p>
            <p className="text-xs text-muted-foreground">awaiting payment</p>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden border-green-200 dark:border-green-900">
          <div className="absolute right-2 top-2 h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <CheckCircle className="h-4 w-4 text-green-600" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Confirmed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{stats.confirmed}</p>
            <p className="text-xs text-muted-foreground">paid & locked</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <QuickActions
        gameId={game.id}
        gameStatus={game.status}
        availableSquares={stats.available}
        reservedSquares={stats.reserved}
        confirmedSquares={stats.confirmed}
      />

      {/* Pending Confirmations */}
      <PendingConfirmations gameId={game.id} players={pendingPlayers} />

      {/* Player Management */}
      <PlayerManagement
        gameId={game.id}
        players={game.players}
        squares={game.squares.map((s) => ({
          id: s.id,
          status: s.status,
          playerId: s.playerId,
        }))}
        managerId={game.managerId}
      />
    </div>
  );
}

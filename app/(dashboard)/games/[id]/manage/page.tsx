import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PendingConfirmations } from "@/components/dashboard/pending-confirmations";
import { formatDate } from "@/lib/utils";

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
            {game.teamAway} @ {game.teamHome} • {formatDate(game.gameDate)}
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
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Squares
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Available
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.available}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Payment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-600">{stats.reserved}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Confirmed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{stats.confirmed}</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          {game.status === "OPEN" && (
            <form
              action={async () => {
                "use server";
                await prisma.game.update({
                  where: { id: game.id },
                  data: {
                    status: "LOCKED",
                    lockedAt: new Date(),
                    numbersRow: Array.from({ length: 10 }, (_, i) => i).sort(
                      () => Math.random() - 0.5
                    ),
                    numbersCol: Array.from({ length: 10 }, (_, i) => i).sort(
                      () => Math.random() - 0.5
                    ),
                  },
                });
              }}
            >
              <Button type="submit" variant="destructive">
                Lock Grid & Generate Numbers
              </Button>
            </form>
          )}
          <Button variant="outline" disabled>
            Send Reminders
          </Button>
          <Button variant="outline" disabled>
            Export Data
          </Button>
        </CardContent>
      </Card>

      {/* Pending Confirmations */}
      <PendingConfirmations gameId={game.id} players={pendingPlayers} />

      {/* All Players */}
      <Card>
        <CardHeader>
          <CardTitle>All Players ({game.players.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {game.players.length === 0 ? (
            <p className="text-muted-foreground">No players yet.</p>
          ) : (
            <div className="space-y-2">
              {game.players.map((gp) => {
                const playerSquares = game.squares.filter(
                  (s) => s.playerId === gp.userId
                );
                const confirmed = playerSquares.filter(
                  (s) => s.status === "CONFIRMED"
                ).length;
                const reserved = playerSquares.filter(
                  (s) => s.status === "RESERVED"
                ).length;

                return (
                  <div
                    key={gp.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium">{gp.user.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {gp.user.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {reserved > 0 && (
                        <Badge variant="outline" className="bg-yellow-50">
                          {reserved} pending
                        </Badge>
                      )}
                      {confirmed > 0 && (
                        <Badge variant="outline" className="bg-green-50">
                          {confirmed} confirmed
                        </Badge>
                      )}
                      <Badge>{gp.role}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Plus, Calendar, Users, Grid3X3, Trophy, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Dashboard - Football Squares",
  description: "Manage your football squares games",
};

async function getGames(userId: string) {
  const managedGames = await prisma.game.findMany({
    where: { managerId: userId },
    include: {
      squares: true,
      _count: { select: { players: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const playerGames = await prisma.game.findMany({
    where: {
      players: { some: { userId } },
      managerId: { not: userId },
    },
    include: {
      manager: { select: { name: true } },
      squares: { where: { playerId: userId } },
    },
    orderBy: { gameDate: "desc" },
  });

  return { managedGames, playerGames };
}

function getStatusColor(status: string) {
  switch (status) {
    case "DRAFT":
      return "bg-gray-500";
    case "OPEN":
      return "bg-green-500";
    case "LOCKED":
      return "bg-yellow-500";
    case "IN_PROGRESS":
      return "bg-blue-500";
    case "COMPLETED":
      return "bg-purple-500";
    case "CANCELLED":
      return "bg-red-500";
    default:
      return "bg-gray-500";
  }
}

function getSquareStats(squares: { status: string }[]) {
  const available = squares.filter((s) => s.status === "AVAILABLE").length;
  const reserved = squares.filter((s) => s.status === "RESERVED").length;
  const confirmed = squares.filter((s) => s.status === "CONFIRMED").length;
  return { available, reserved, confirmed, total: 100 };
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }

  const { managedGames, playerGames } = await getGames(session.user.id);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {session.user.name}
          </p>
        </div>
        <Button asChild size="lg" className="gap-2">
          <Link href="/games/create">
            <Plus className="h-5 w-5" />
            Create New Game
          </Link>
        </Button>
      </div>

      {/* Quick Stats */}
      {managedGames.length > 0 && (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Games
              </CardTitle>
              <Grid3X3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{managedGames.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Games
              </CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {managedGames.filter(g => g.status === "OPEN" || g.status === "LOCKED").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Players
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {managedGames.reduce((acc, g) => acc + g._count.players, 0)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Squares Sold
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {managedGames.reduce((acc, g) => acc + g.squares.filter(s => s.status !== "AVAILABLE").length, 0)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Managed Games */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Your Games</h2>
          {managedGames.length > 0 && (
            <Button variant="ghost" size="sm" asChild>
              <Link href="/games/create" className="gap-1">
                Create new <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
        {managedGames.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="rounded-full bg-primary/10 p-4 mb-4">
                <Grid3X3 className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No games yet</h3>
              <p className="text-muted-foreground mb-6 text-center max-w-sm">
                Create your first football squares game and invite friends to play
              </p>
              <Button asChild size="lg">
                <Link href="/games/create" className="gap-2">
                  <Plus className="h-5 w-5" />
                  Create Your First Game
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {managedGames.map((game) => {
              const stats = getSquareStats(game.squares);
              const fillPercentage = ((stats.reserved + stats.confirmed) / 100) * 100;
              return (
                <Card key={game.id} className="group hover:shadow-lg transition-all duration-200 hover:border-primary/50">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <CardTitle className="text-lg line-clamp-1">{game.name}</CardTitle>
                        <CardDescription className="flex items-center gap-1">
                          <span className="font-medium">{game.teamAway}</span>
                          <span className="text-muted-foreground">@</span>
                          <span className="font-medium">{game.teamHome}</span>
                        </CardDescription>
                      </div>
                      <Badge className={`${getStatusColor(game.status)} shrink-0`}>
                        {game.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {formatDate(game.gameDate)}
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Grid Progress</span>
                        <span className="font-medium">{stats.reserved + stats.confirmed}/100</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-green-500 transition-all duration-500"
                          style={{ width: `${fillPercentage}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-sm">
                      <div className="rounded-lg bg-muted/50 p-2">
                        <p className="font-semibold">{stats.available}</p>
                        <p className="text-xs text-muted-foreground">Open</p>
                      </div>
                      <div className="rounded-lg bg-yellow-500/10 p-2">
                        <p className="font-semibold text-yellow-600">{stats.reserved}</p>
                        <p className="text-xs text-muted-foreground">Reserved</p>
                      </div>
                      <div className="rounded-lg bg-green-500/10 p-2">
                        <p className="font-semibold text-green-600">{stats.confirmed}</p>
                        <p className="text-xs text-muted-foreground">Paid</p>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button asChild variant="outline" className="flex-1">
                        <Link href={`/games/${game.id}`}>View Grid</Link>
                      </Button>
                      <Button asChild className="flex-1">
                        <Link href={`/games/${game.id}/manage`}>Manage</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Games as Player */}
      {playerGames.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-4">Games You&apos;ve Joined</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {playerGames.map((game) => (
              <Card key={game.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{game.name}</CardTitle>
                    <Badge className={getStatusColor(game.status)}>
                      {game.status}
                    </Badge>
                  </div>
                  <CardDescription>
                    {game.teamAway} @ {game.teamHome}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      {formatDate(game.gameDate)}
                    </p>
                    <p className="text-sm">
                      Managed by <span className="font-medium">{game.manager.name}</span>
                    </p>
                    <p className="text-sm">
                      Your squares:{" "}
                      <span className="font-medium">{game.squares.length}</span>
                    </p>
                    <Button asChild className="w-full">
                      <Link href={`/games/${game.id}`}>View Grid</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

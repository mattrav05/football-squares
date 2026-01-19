import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {session.user.name}
          </p>
        </div>
        <Button asChild>
          <Link href="/games/create">Create New Game</Link>
        </Button>
      </div>

      {/* Managed Games */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Your Games</h2>
        {managedGames.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">
                You haven&apos;t created any games yet.
              </p>
              <Button asChild>
                <Link href="/games/create">Create Your First Game</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {managedGames.map((game) => {
              const stats = getSquareStats(game.squares);
              return (
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
                      <div className="grid grid-cols-3 gap-2 text-center text-sm">
                        <div className="rounded-md bg-muted p-2">
                          <p className="font-medium">{stats.available}</p>
                          <p className="text-xs text-muted-foreground">Available</p>
                        </div>
                        <div className="rounded-md bg-yellow-100 p-2 dark:bg-yellow-900/20">
                          <p className="font-medium">{stats.reserved}</p>
                          <p className="text-xs text-muted-foreground">Reserved</p>
                        </div>
                        <div className="rounded-md bg-green-100 p-2 dark:bg-green-900/20">
                          <p className="font-medium">{stats.confirmed}</p>
                          <p className="text-xs text-muted-foreground">Confirmed</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button asChild variant="outline" className="flex-1">
                          <Link href={`/games/${game.id}`}>View Grid</Link>
                        </Button>
                        <Button asChild className="flex-1">
                          <Link href={`/games/${game.id}/manage`}>Manage</Link>
                        </Button>
                      </div>
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

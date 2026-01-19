import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GameGrid } from "@/components/grid/game-grid";
import { LegalDisclaimer } from "@/components/shared/legal-disclaimer";
import { formatDate, formatCurrency } from "@/lib/utils";

interface GamePageProps {
  params: Promise<{ id: string }>;
}

async function getGame(id: string, userId: string) {
  const game = await prisma.game.findUnique({
    where: { id },
    include: {
      manager: { select: { id: true, name: true, email: true } },
      squares: {
        include: {
          player: { select: { id: true, name: true } },
        },
      },
      players: {
        include: {
          user: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!game) return null;

  const isManager = game.managerId === userId;
  const isPlayer = game.players.some((p) => p.userId === userId);

  return { game, isManager, isPlayer };
}

export default async function GamePage({ params }: GamePageProps) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const result = await getGame(id, session.user.id);

  if (!result) {
    notFound();
  }

  const { game, isManager } = result;

  const stats = {
    available: game.squares.filter((s) => s.status === "AVAILABLE").length,
    reserved: game.squares.filter((s) => s.status === "RESERVED").length,
    confirmed: game.squares.filter((s) => s.status === "CONFIRMED").length,
  };

  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || ""}/join/${game.entryCode}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold">{game.name}</h1>
            <Badge
              className={
                game.status === "OPEN"
                  ? "bg-green-500"
                  : game.status === "LOCKED"
                  ? "bg-yellow-500"
                  : "bg-gray-500"
              }
            >
              {game.status}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            {game.teamAway} @ {game.teamHome} • {formatDate(game.gameDate)}
          </p>
        </div>
        {isManager && (
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/games/${game.id}/settings`}>Settings</Link>
            </Button>
            <Button asChild>
              <Link href={`/games/${game.id}/manage`}>Manage</Link>
            </Button>
          </div>
        )}
      </div>

      {/* Stats & Share */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
              Reserved
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
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Price/Square
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {game.pricePerSquare
                ? formatCurrency(Number(game.pricePerSquare))
                : "Free"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Share Link */}
      {isManager && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Share with Players</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded bg-muted px-3 py-2 text-sm break-all">
                {shareUrl}
              </code>
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(shareUrl);
                }}
              >
                Copy
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payout Structure */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Payout Structure</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-lg font-bold">{game.payoutQ1}%</p>
              <p className="text-xs text-muted-foreground">Q1</p>
            </div>
            <div>
              <p className="text-lg font-bold">{game.payoutQ2}%</p>
              <p className="text-xs text-muted-foreground">Q2</p>
            </div>
            <div>
              <p className="text-lg font-bold">{game.payoutQ3}%</p>
              <p className="text-xs text-muted-foreground">Q3</p>
            </div>
            <div>
              <p className="text-lg font-bold">{game.payoutFinal}%</p>
              <p className="text-xs text-muted-foreground">Final</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Game Grid */}
      <GameGrid
        gameId={game.id}
        squares={game.squares.map((s) => ({
          id: s.id,
          rowIndex: s.rowIndex,
          colIndex: s.colIndex,
          status: s.status,
          playerId: s.playerId,
          player: s.player,
        }))}
        numbersRow={game.numbersRow}
        numbersCol={game.numbersCol}
        teamHome={game.teamHome}
        teamAway={game.teamAway}
        colorPrimary={game.colorPrimary}
        colorSecondary={game.colorSecondary}
        currentUserId={session.user.id}
        isManager={isManager}
        isLocked={game.status === "LOCKED" || game.status === "COMPLETED"}
        maxSquaresPerPlayer={game.maxSquaresPerPlayer}
      />

      {/* Legal */}
      <LegalDisclaimer />
    </div>
  );
}

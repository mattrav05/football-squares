import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GameGrid } from "@/components/grid/game-grid";
import { LegalDisclaimer } from "@/components/shared/legal-disclaimer";
import { CopyButton } from "@/components/shared/copy-button";
import { QRCode } from "@/components/shared/qr-code";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Calendar, DollarSign, Users, CheckCircle, Clock, Share2 } from "lucide-react";

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
            {game.teamHome} vs {game.teamAway} • {formatDate(game.gameDate)}
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

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
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
            <p className="text-xs text-muted-foreground">of 100 squares</p>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden border-yellow-200 dark:border-yellow-900">
          <div className="absolute right-2 top-2 h-8 w-8 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
            <Clock className="h-4 w-4 text-yellow-600" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Reserved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-600">{stats.reserved}</p>
            <p className="text-xs text-muted-foreground">pending payment</p>
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
        <Card className="relative overflow-hidden">
          <div className="absolute right-2 top-2 h-8 w-8 rounded-full bg-muted flex items-center justify-center">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Price/Square
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {game.pricePerSquare
                ? formatCurrency(Number(game.pricePerSquare))
                : "Free"}
            </p>
            <p className="text-xs text-muted-foreground">per square</p>
          </CardContent>
        </Card>
      </div>

      {/* Share Link */}
      {isManager && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              Share with Players
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <QRCode value={shareUrl} size={100} />
              <div className="flex-1 space-y-3">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <code className="flex-1 rounded-lg bg-background border px-4 py-3 text-sm break-all font-mono">
                    {shareUrl}
                  </code>
                  <CopyButton text={shareUrl} />
                </div>
                <p className="text-xs text-muted-foreground">
                  Scan the QR code or share this link with friends so they can join and pick squares
                </p>
              </div>
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

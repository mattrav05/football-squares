"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { CardDescription } from "@/components/ui/card";
import { getTimeRemaining } from "@/lib/utils";
import { Clock } from "lucide-react";

interface Square {
  id: string;
  rowIndex: number;
  colIndex: number;
  reservedAt: Date | null;
}

interface Player {
  id: string;
  name: string;
  email: string;
}

interface PendingPlayer {
  player: Player;
  squares: Square[];
}

interface PendingConfirmationsProps {
  gameId: string;
  players: PendingPlayer[];
}

export function PendingConfirmations({
  gameId,
  players,
}: PendingConfirmationsProps) {
  const router = useRouter();
  const [selectedSquares, setSelectedSquares] = useState<Set<string>>(new Set());
  const [isConfirming, setIsConfirming] = useState(false);

  const toggleSquare = (squareId: string) => {
    setSelectedSquares((prev) => {
      const next = new Set(prev);
      if (next.has(squareId)) {
        next.delete(squareId);
      } else {
        next.add(squareId);
      }
      return next;
    });
  };

  const selectAllForPlayer = (squares: Square[]) => {
    setSelectedSquares((prev) => {
      const next = new Set(prev);
      squares.forEach((s) => next.add(s.id));
      return next;
    });
  };

  const confirmSelected = async () => {
    if (selectedSquares.size === 0) return;

    setIsConfirming(true);
    try {
      const response = await fetch(`/api/games/${gameId}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ squareIds: Array.from(selectedSquares) }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.message || "Failed to confirm payments");
        return;
      }

      toast.success(`Confirmed ${selectedSquares.size} square(s)`);
      setSelectedSquares(new Set());
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsConfirming(false);
    }
  };

  if (players.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/10">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <CardTitle>Pending Confirmations</CardTitle>
              <CardDescription>Confirm payments when players have paid</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">No pending payments to confirm.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-yellow-200 dark:border-yellow-900/50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/10">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <CardTitle>Pending Confirmations</CardTitle>
              <CardDescription>Select squares and confirm when paid</CardDescription>
            </div>
          </div>
          {selectedSquares.size > 0 && (
            <Button onClick={confirmSelected} disabled={isConfirming} className="bg-green-600 hover:bg-green-700">
              {isConfirming
                ? "Confirming..."
                : `Confirm ${selectedSquares.size} Square(s)`}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {players.map(({ player, squares }) => (
          <div key={player.id} className="rounded-lg border p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-medium">{player.name}</p>
                <p className="text-sm text-muted-foreground">{player.email}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => selectAllForPlayer(squares)}
              >
                Select All ({squares.length})
              </Button>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {squares.map((square) => {
                const squareNumber = square.rowIndex * 10 + square.colIndex + 1;
                const expiresAt = square.reservedAt
                  ? new Date(
                      new Date(square.reservedAt).getTime() + 24 * 60 * 60 * 1000
                    )
                  : null;

                return (
                  <label
                    key={square.id}
                    className="flex items-center gap-2 rounded border p-2 cursor-pointer hover:bg-muted transition-colors"
                  >
                    <Checkbox
                      checked={selectedSquares.has(square.id)}
                      onCheckedChange={() => toggleSquare(square.id)}
                    />
                    <div className="text-sm">
                      <p className="font-bold text-base">#{squareNumber}</p>
                      {expiresAt && (
                        <p className="text-xs text-muted-foreground">
                          {getTimeRemaining(expiresAt)}
                        </p>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

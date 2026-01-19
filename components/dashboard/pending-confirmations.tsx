"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { getTimeRemaining } from "@/lib/utils";

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
        <CardHeader>
          <CardTitle>Pending Confirmations</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No pending payments to confirm.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Pending Confirmations</CardTitle>
        {selectedSquares.size > 0 && (
          <Button onClick={confirmSelected} disabled={isConfirming}>
            {isConfirming
              ? "Confirming..."
              : `Confirm ${selectedSquares.size} Square(s)`}
          </Button>
        )}
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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {squares.map((square) => {
                const expiresAt = square.reservedAt
                  ? new Date(
                      new Date(square.reservedAt).getTime() + 24 * 60 * 60 * 1000
                    )
                  : null;

                return (
                  <label
                    key={square.id}
                    className="flex items-center gap-2 rounded border p-2 cursor-pointer hover:bg-muted"
                  >
                    <Checkbox
                      checked={selectedSquares.has(square.id)}
                      onCheckedChange={() => toggleSquare(square.id)}
                    />
                    <div className="text-sm">
                      <p className="font-medium">
                        {String.fromCharCode(65 + square.rowIndex)}
                        {square.colIndex + 1}
                      </p>
                      {expiresAt && (
                        <p className="text-xs text-muted-foreground">
                          Expires: {getTimeRemaining(expiresAt)}
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

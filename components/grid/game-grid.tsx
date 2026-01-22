"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Square } from "./square";
import { GridLegend } from "./grid-legend";
import { Button } from "@/components/ui/button";

interface SquareData {
  id: string;
  rowIndex: number;
  colIndex: number;
  status: "AVAILABLE" | "RESERVED" | "CONFIRMED";
  playerId: string | null;
  player?: { id: string; name: string } | null;
}

interface GameGridProps {
  gameId: string;
  squares: SquareData[];
  numbersRow: number[];
  numbersCol: number[];
  teamHome: string;
  teamAway: string;
  colorPrimary: string;
  colorSecondary: string;
  currentUserId: string;
  isManager: boolean;
  isLocked: boolean;
  maxSquaresPerPlayer: number;
}

export function GameGrid({
  gameId,
  squares: initialSquares,
  numbersRow,
  numbersCol,
  teamHome,
  teamAway,
  colorPrimary,
  colorSecondary,
  currentUserId,
  isManager,
  isLocked,
  maxSquaresPerPlayer,
}: GameGridProps) {
  const [squares, setSquares] = useState(initialSquares);
  const [selectedSquares, setSelectedSquares] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get current user's square count
  const userSquareCount = squares.filter(
    (s) => s.playerId === currentUserId && s.status !== "AVAILABLE"
  ).length;

  // SSE connection for real-time updates
  useEffect(() => {
    const eventSource = new EventSource(`/api/games/${gameId}/stream`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "squares_updated") {
          setSquares(data.squares);
        }
      } catch {
        // Ignore parse errors
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [gameId]);

  const handleSquareClick = useCallback(
    (square: SquareData) => {
      if (isLocked) {
        toast.error("This grid is locked");
        return;
      }

      // If it's the user's own reserved square, allow deselecting
      if (
        square.playerId === currentUserId &&
        square.status === "RESERVED"
      ) {
        // Can toggle off own reserved squares
        setSelectedSquares((prev) => {
          const next = new Set(prev);
          if (next.has(square.id)) {
            next.delete(square.id);
          }
          return next;
        });
        return;
      }

      // Can't select confirmed or other players' squares
      if (square.status !== "AVAILABLE") {
        if (square.status === "CONFIRMED") {
          toast.error("This square is already confirmed");
        } else {
          toast.error("This square is already reserved");
        }
        return;
      }

      // Check max squares limit
      const potentialTotal =
        userSquareCount + selectedSquares.size + 1;
      if (potentialTotal > maxSquaresPerPlayer) {
        toast.error(`Maximum ${maxSquaresPerPlayer} squares per player`);
        return;
      }

      setSelectedSquares((prev) => {
        const next = new Set(prev);
        if (next.has(square.id)) {
          next.delete(square.id);
        } else {
          next.add(square.id);
        }
        return next;
      });
    },
    [isLocked, currentUserId, userSquareCount, selectedSquares.size, maxSquaresPerPlayer]
  );

  const handleSubmitSelection = async () => {
    if (selectedSquares.size === 0) return;

    setIsSubmitting(true);
    try {
      const squaresToSelect = Array.from(selectedSquares).map((id) => {
        const square = squares.find((s) => s.id === id);
        return { rowIndex: square!.rowIndex, colIndex: square!.colIndex };
      });

      const response = await fetch(`/api/games/${gameId}/squares`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ squares: squaresToSelect }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.message || "Failed to reserve squares");
        return;
      }

      const updatedSquares = await response.json();
      setSquares(updatedSquares);
      setSelectedSquares(new Set());
      toast.success(`Reserved ${selectedSquares.size} square(s)`);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasNumbers = numbersRow.length > 0 && numbersCol.length > 0;

  return (
    <div className="space-y-4">
      <GridLegend />

      {/* Grid Container */}
      <div className="overflow-x-auto pb-4">
        <div className="inline-block min-w-fit">
          {/* Away Team Header */}
          <div className="flex">
            <div className="w-12 h-10" /> {/* Corner spacer */}
            <div
              className="flex-1 text-center font-bold text-sm py-2 rounded-t-lg shadow-sm"
              style={{ backgroundColor: colorSecondary, color: "#fff" }}
            >
              {teamAway}
            </div>
          </div>

          {/* Column Numbers */}
          <div className="flex">
            <div className="w-12 h-10" /> {/* Corner spacer */}
            {Array.from({ length: 10 }).map((_, col) => (
              <div
                key={col}
                className="w-10 h-10 flex items-center justify-center text-sm font-bold rounded-sm mx-px"
                style={{ backgroundColor: colorSecondary + "30" }}
              >
                {hasNumbers ? (
                  <span className="text-foreground">{numbersCol[col]}</span>
                ) : (
                  <span className="text-muted-foreground text-xs">?</span>
                )}
              </div>
            ))}
          </div>

          {/* Grid Rows */}
          <div className="flex">
            {/* Home Team & Row Numbers */}
            <div className="flex flex-col">
              <div
                className="w-12 flex items-center justify-center font-bold text-xs rounded-l-lg shadow-sm"
                style={{
                  backgroundColor: colorPrimary,
                  color: "#fff",
                  height: `${10 * 40 + 9}px`,
                  writingMode: "vertical-rl",
                  transform: "rotate(180deg)",
                }}
              >
                {teamHome}
              </div>
            </div>

            <div className="flex flex-col gap-px">
              {/* Row Numbers */}
              {Array.from({ length: 10 }).map((_, row) => (
                <div key={row} className="flex gap-px">
                  <div
                    className="w-10 h-10 flex items-center justify-center text-sm font-bold rounded-sm"
                    style={{ backgroundColor: colorPrimary + "30" }}
                  >
                    {hasNumbers ? (
                      <span className="text-foreground">{numbersRow[row]}</span>
                    ) : (
                      <span className="text-muted-foreground text-xs">?</span>
                    )}
                  </div>

                  {/* Squares */}
                  {Array.from({ length: 10 }).map((_, col) => {
                    const square = squares.find(
                      (s) => s.rowIndex === row && s.colIndex === col
                    );
                    if (!square) return null;

                    const isOwn = square.playerId === currentUserId;
                    const isSelected = selectedSquares.has(square.id);

                    return (
                      <Square
                        key={square.id}
                        square={square}
                        isOwn={isOwn}
                        isSelected={isSelected}
                        onClick={() => handleSquareClick(square)}
                        colorPrimary={colorPrimary}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Selection Actions */}
      {selectedSquares.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 shadow-lg md:static md:border-0 md:shadow-none md:p-0">
          <div className="container flex items-center justify-between gap-4">
            <p className="text-sm">
              <span className="font-medium">{selectedSquares.size}</span> square(s)
              selected
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setSelectedSquares(new Set())}
                disabled={isSubmitting}
              >
                Clear
              </Button>
              <Button onClick={handleSubmitSelection} disabled={isSubmitting}>
                {isSubmitting ? "Reserving..." : "Reserve Squares"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="text-sm text-muted-foreground">
        Your squares: {userSquareCount} / {maxSquaresPerPlayer}
      </div>
    </div>
  );
}

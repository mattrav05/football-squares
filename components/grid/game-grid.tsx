"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
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

const CELL_SIZE = 56; // Big cells for easy selection
const GAP_SIZE = 2;
const SIDEBAR_WIDTH = 40;
const HEADER_OFFSET = SIDEBAR_WIDTH + CELL_SIZE + GAP_SIZE; // Sidebar + row numbers + gap

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

  const userSquareCount = squares.filter(
    (s) => s.playerId === currentUserId && s.status !== "AVAILABLE"
  ).length;

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

      if (square.playerId === currentUserId && square.status === "RESERVED") {
        setSelectedSquares((prev) => {
          const next = new Set(prev);
          if (next.has(square.id)) {
            next.delete(square.id);
          }
          return next;
        });
        return;
      }

      if (square.status !== "AVAILABLE") {
        if (square.status === "CONFIRMED") {
          toast.error("This square is already confirmed");
        } else {
          toast.error("This square is already reserved");
        }
        return;
      }

      const potentialTotal = userSquareCount + selectedSquares.size + 1;
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
  const gridWidth = 10 * CELL_SIZE + 9 * GAP_SIZE;

  return (
    <div className="space-y-6">
      <GridLegend />

      {/* Grid Container */}
      <div className="overflow-x-auto py-4">
        <div className="inline-block">
          {/* Away Team Header */}
          <div className="flex items-center mb-2">
            <div style={{ width: HEADER_OFFSET }} /> {/* Corner spacer */}
            <div
              className="text-center font-bold text-base py-3 rounded-t-lg shadow-md tracking-wide"
              style={{
                width: gridWidth,
                backgroundColor: colorSecondary,
                color: "#fff",
                textShadow: "0 1px 2px rgba(0,0,0,0.3)"
              }}
            >
              {teamAway}
            </div>
          </div>

          {/* Column Numbers Row */}
          <div className="flex items-center">
            <div style={{ width: HEADER_OFFSET }} /> {/* Corner spacer */}
            <div
              className="grid"
              style={{
                gridTemplateColumns: `repeat(10, ${CELL_SIZE}px)`,
                gap: GAP_SIZE
              }}
            >
              {Array.from({ length: 10 }).map((_, col) => (
                <div
                  key={col}
                  className="flex items-center justify-center font-bold rounded-md shadow-sm"
                  style={{
                    width: CELL_SIZE,
                    height: CELL_SIZE,
                    backgroundColor: colorSecondary + "30",
                    border: `2px solid ${colorSecondary}50`
                  }}
                >
                  {hasNumbers ? (
                    <span className="text-xl font-black" style={{ color: colorSecondary }}>
                      {numbersCol[col]}
                    </span>
                  ) : (
                    <span className="text-3xl font-light text-muted-foreground/40">?</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Main Grid Area */}
          <div className="flex" style={{ marginTop: GAP_SIZE }}>
            {/* Home Team Sidebar */}
            <div className="flex">
              <div
                className="flex items-center justify-center font-bold text-base rounded-l-lg shadow-md tracking-wide"
                style={{
                  width: SIDEBAR_WIDTH,
                  height: 10 * CELL_SIZE + 9 * GAP_SIZE,
                  backgroundColor: colorPrimary,
                  color: "#fff",
                  writingMode: "vertical-rl",
                  transform: "rotate(180deg)",
                  textShadow: "0 1px 2px rgba(0,0,0,0.3)"
                }}
              >
                {teamHome}
              </div>

              {/* Row Numbers Column */}
              <div
                className="grid"
                style={{
                  gridTemplateRows: `repeat(10, ${CELL_SIZE}px)`,
                  gap: GAP_SIZE,
                  marginLeft: GAP_SIZE
                }}
              >
                {Array.from({ length: 10 }).map((_, row) => (
                  <div
                    key={row}
                    className="flex items-center justify-center font-bold rounded-md shadow-sm"
                    style={{
                      width: CELL_SIZE,
                      height: CELL_SIZE,
                      backgroundColor: colorPrimary + "30",
                      border: `2px solid ${colorPrimary}50`
                    }}
                  >
                    {hasNumbers ? (
                      <span className="text-xl font-black" style={{ color: colorPrimary }}>
                        {numbersRow[row]}
                      </span>
                    ) : (
                      <span className="text-3xl font-light text-muted-foreground/40">?</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Squares Grid */}
            <div
              className="grid"
              style={{
                gridTemplateColumns: `repeat(10, ${CELL_SIZE}px)`,
                gap: GAP_SIZE,
                marginLeft: GAP_SIZE
              }}
            >
              {Array.from({ length: 10 }).map((_, row) =>
                Array.from({ length: 10 }).map((_, col) => {
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
                      size={CELL_SIZE}
                    />
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Selection Actions */}
      {selectedSquares.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 shadow-lg z-50 md:static md:border md:rounded-lg md:shadow-md md:p-4">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm">
              <span className="font-bold text-lg">{selectedSquares.size}</span> square(s) selected
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setSelectedSquares(new Set())}
                disabled={isSubmitting}
              >
                Clear
              </Button>
              <Button onClick={handleSubmitSelection} disabled={isSubmitting} size="lg">
                {isSubmitting ? "Reserving..." : "Reserve Squares"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3 inline-block">
        Your squares: <span className="font-bold text-foreground">{userSquareCount}</span> / {maxSquaresPerPlayer}
      </div>
    </div>
  );
}

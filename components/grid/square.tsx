"use client";

import { cn } from "@/lib/utils";

interface SquareProps {
  square: {
    id: string;
    status: "AVAILABLE" | "RESERVED" | "CONFIRMED";
    player?: { id: string; name: string } | null;
  };
  isOwn: boolean;
  isSelected: boolean;
  onClick: () => void;
  colorPrimary: string;
}

export function Square({
  square,
  isOwn,
  isSelected,
  onClick,
  colorPrimary,
}: SquareProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-10 h-10 border border-border text-xs font-medium transition-all duration-150",
        "hover:scale-105 hover:z-10 hover:shadow-md",
        "focus:outline-none focus:ring-2 focus:ring-offset-1",
        "touch-manipulation",
        // Available
        square.status === "AVAILABLE" && "bg-background hover:bg-muted",
        // Reserved (pending)
        square.status === "RESERVED" &&
          !isOwn &&
          "bg-yellow-100 dark:bg-yellow-900/30",
        // Confirmed
        square.status === "CONFIRMED" &&
          !isOwn &&
          "bg-green-100 dark:bg-green-900/30",
        // Own squares
        isOwn && square.status === "RESERVED" && "bg-yellow-200 dark:bg-yellow-800/50",
        isOwn && square.status === "CONFIRMED" && "bg-green-200 dark:bg-green-800/50",
        // Selected for reservation
        isSelected && "ring-2 ring-offset-1"
      )}
      style={{
        ...(isSelected && { ringColor: colorPrimary }),
        ...(isOwn && { borderColor: colorPrimary }),
      }}
      title={
        square.player
          ? `${square.player.name} (${square.status.toLowerCase()})`
          : square.status === "AVAILABLE"
          ? "Available"
          : ""
      }
    >
      {square.player ? (
        <span
          className={cn(
            "block truncate",
            isOwn && "font-bold"
          )}
        >
          {getInitials(square.player.name)}
        </span>
      ) : isSelected ? (
        <span style={{ color: colorPrimary }}>+</span>
      ) : null}
    </button>
  );
}

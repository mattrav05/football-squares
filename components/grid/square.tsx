"use client";

import { cn } from "@/lib/utils";

interface SquareProps {
  square: {
    id: string;
    rowIndex: number;
    colIndex: number;
    status: "AVAILABLE" | "RESERVED" | "CONFIRMED";
    player?: { id: string; name: string } | null;
  };
  isOwn: boolean;
  isSelected: boolean;
  onClick: () => void;
  colorPrimary: string;
  size?: number;
}

export function Square({
  square,
  isOwn,
  isSelected,
  onClick,
  colorPrimary,
  size = 48,
}: SquareProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Calculate square number 1-100 (row * 10 + col + 1)
  const squareNumber = square.rowIndex * 10 + square.colIndex + 1;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-sm text-xs font-medium transition-all duration-150",
        "hover:scale-110 hover:z-10 hover:shadow-lg",
        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1",
        "touch-manipulation active:scale-95",
        // Available - dashed border, empty
        square.status === "AVAILABLE" && !isSelected &&
          "bg-background border-2 border-dashed border-muted-foreground/20 hover:border-primary/50 hover:bg-primary/5",
        // Reserved (pending) - yellow
        square.status === "RESERVED" &&
          !isOwn &&
          "bg-yellow-400/80 dark:bg-yellow-500/60 text-yellow-900 dark:text-yellow-100 border border-yellow-500/50",
        // Confirmed - green
        square.status === "CONFIRMED" &&
          !isOwn &&
          "bg-green-500/80 dark:bg-green-500/60 text-white border border-green-600/50",
        // Own reserved squares - highlighted yellow
        isOwn && square.status === "RESERVED" &&
          "bg-yellow-400 dark:bg-yellow-500 text-yellow-900 dark:text-yellow-100 border-2 shadow-md",
        // Own confirmed squares - highlighted green
        isOwn && square.status === "CONFIRMED" &&
          "bg-green-500 dark:bg-green-600 text-white border-2 shadow-md",
        // Selected for reservation - ring effect
        isSelected && "ring-2 ring-offset-2 bg-primary/10 border-primary border-2"
      )}
      style={{
        width: size,
        height: size,
        ...(isOwn && { borderColor: colorPrimary }),
        ...(isSelected && { borderColor: colorPrimary }),
      }}
      title={
        square.player
          ? `${square.player.name} (${square.status.toLowerCase()})`
          : square.status === "AVAILABLE"
          ? "Click to select"
          : ""
      }
    >
      <div className="flex flex-col items-center justify-center h-full">
        {/* Square Number */}
        <span
          className={cn(
            "font-bold",
            square.player ? "text-[10px] opacity-60" : "text-base",
            square.status === "AVAILABLE" && !isSelected && "text-muted-foreground/70",
            isSelected && "text-primary"
          )}
        >
          {squareNumber}
        </span>
        {/* Player Initials */}
        {square.player && (
          <span
            className={cn(
              "font-bold text-xs leading-tight",
              isOwn && "font-extrabold"
            )}
          >
            {getInitials(square.player.name)}
          </span>
        )}
        {/* Selection indicator */}
        {isSelected && !square.player && (
          <span className="text-primary font-bold text-xs">+</span>
        )}
      </div>
    </button>
  );
}

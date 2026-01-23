"use client";

import { PasswordGate } from "./password-gate";

interface GameContentWrapperProps {
  gameId: string;
  gameName: string;
  requiresPassword: boolean;
  hasAccess: boolean;
  children: React.ReactNode;
}

export function GameContentWrapper({
  gameId,
  gameName,
  requiresPassword,
  hasAccess,
  children,
}: GameContentWrapperProps) {
  // If no password required or user already has access, show content
  if (!requiresPassword || hasAccess) {
    return <>{children}</>;
  }

  // Password required and user doesn't have access
  return (
    <PasswordGate gameId={gameId} gameName={gameName}>
      {children}
    </PasswordGate>
  );
}

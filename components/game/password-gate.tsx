"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, ShieldCheck } from "lucide-react";

interface PasswordGateProps {
  gameId: string;
  gameName: string;
  children: React.ReactNode;
}

export function PasswordGate({ gameId, gameName, children }: PasswordGateProps) {
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Check if user already has access (stored in sessionStorage)
  useEffect(() => {
    const accessKey = `game_access_${gameId}`;
    const hasAccess = sessionStorage.getItem(accessKey);

    if (hasAccess === "true") {
      setIsVerified(true);
    } else {
      // Check with server if password is required
      checkPasswordRequired();
    }
  }, [gameId]);

  const checkPasswordRequired = async () => {
    try {
      const response = await fetch(`/api/games/${gameId}/access`, {
        method: "GET",
      });

      if (response.ok) {
        const data = await response.json();
        if (!data.passwordRequired) {
          // No password required, grant access
          setIsVerified(true);
        } else if (data.hasAccess) {
          // User already has access (manager or verified)
          sessionStorage.setItem(`game_access_${gameId}`, "true");
          setIsVerified(true);
        } else {
          // Password required
          setIsVerified(false);
        }
      }
    } catch {
      // On error, assume no password required
      setIsVerified(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password.trim()) {
      toast.error("Please enter the password");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/games/${gameId}/access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.message || "Incorrect password");
        return;
      }

      // Store access in sessionStorage
      sessionStorage.setItem(`game_access_${gameId}`, "true");
      setIsVerified(true);
      toast.success("Access granted");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  // Still checking
  if (isVerified === null) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Access granted
  if (isVerified) {
    return <>{children}</>;
  }

  // Password required
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-xl">Password Protected</CardTitle>
          <CardDescription>
            This game requires a password to access. Enter the password provided by the game manager.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="gamePassword">Game Password</Label>
              <Input
                id="gamePassword"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="off"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Verifying..." : "Access Game"}
            </Button>
          </form>
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground text-center">
              <ShieldCheck className="h-3 w-3 inline mr-1" />
              Game: <strong>{gameName}</strong>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

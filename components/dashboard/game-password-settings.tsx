"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Lock, AlertTriangle, Shield, Eye, EyeOff } from "lucide-react";

interface GamePasswordSettingsProps {
  gameId: string;
  hasPassword: boolean;
}

export function GamePasswordSettings({ gameId, hasPassword }: GamePasswordSettingsProps) {
  const router = useRouter();
  const [isEnabled, setIsEnabled] = useState(hasPassword);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = (enabled: boolean) => {
    setIsEnabled(enabled);
    if (!enabled) {
      // Clear password when disabling
      setPassword("");
      setConfirmPassword("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isEnabled) {
      if (!password) {
        toast.error("Please enter a password");
        return;
      }

      if (password.length < 4) {
        toast.error("Password must be at least 4 characters");
        return;
      }

      if (password !== confirmPassword) {
        toast.error("Passwords do not match");
        return;
      }
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/games/${gameId}/password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled: isEnabled,
          password: isEnabled ? password : null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.message || "Failed to update password settings");
        return;
      }

      toast.success(isEnabled ? "Password protection enabled" : "Password protection disabled");
      setPassword("");
      setConfirmPassword("");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
            <Lock className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <CardTitle>Password Protection</CardTitle>
            <CardDescription>Require a password to access this game</CardDescription>
          </div>
          <Switch
            checked={isEnabled}
            onCheckedChange={handleToggle}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Security Warning */}
        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <div className="flex gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Security Notice
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                Without password protection, anyone with your game link and an account can view and interact with your game.
                Enable password protection to restrict access to only those who know the password.
              </p>
            </div>
          </div>
        </div>

        {isEnabled && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="gamePassword">
                {hasPassword ? "New Password" : "Set Password"}
              </Label>
              <div className="relative">
                <Input
                  id="gamePassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmGamePassword">Confirm Password</Label>
              <Input
                id="confirmGamePassword"
                type={showPassword ? "text" : "password"}
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : hasPassword ? "Update Password" : "Set Password"}
              </Button>
            </div>

            <div className="p-3 bg-muted rounded-lg">
              <div className="flex gap-2">
                <Shield className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div className="text-xs text-muted-foreground">
                  <p className="font-medium">Password Security</p>
                  <ul className="mt-1 space-y-1 list-disc list-inside">
                    <li>Password is encrypted using industry-standard bcrypt hashing</li>
                    <li>Existing players will retain access without re-entering</li>
                    <li>Share the password securely with your players</li>
                  </ul>
                </div>
              </div>
            </div>
          </form>
        )}

        {!isEnabled && hasPassword && (
          <form onSubmit={handleSubmit}>
            <Button type="submit" variant="destructive" disabled={isLoading}>
              {isLoading ? "Removing..." : "Remove Password Protection"}
            </Button>
          </form>
        )}

        {!isEnabled && !hasPassword && (
          <p className="text-sm text-muted-foreground">
            Password protection is currently disabled. Anyone with the game link can access your game.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

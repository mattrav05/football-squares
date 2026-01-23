"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Lock, Mail, Download, Zap, AlertTriangle } from "lucide-react";

interface QuickActionsProps {
  gameId: string;
  gameStatus: string;
  availableSquares: number;
  reservedSquares: number;
  confirmedSquares: number;
}

export function QuickActions({
  gameId,
  gameStatus,
  availableSquares,
  reservedSquares,
  confirmedSquares,
}: QuickActionsProps) {
  const router = useRouter();
  const [showLockDialog, setShowLockDialog] = useState(false);
  const [isLocking, setIsLocking] = useState(false);

  const totalFilled = reservedSquares + confirmedSquares;
  const isGridFull = availableSquares === 0;

  const handleLockGrid = async () => {
    setIsLocking(true);
    try {
      const response = await fetch(`/api/games/${gameId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "lock" }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.message || "Failed to lock grid");
        return;
      }

      toast.success("Grid locked and numbers generated!");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsLocking(false);
      setShowLockDialog(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Manage your game status and communicate with players</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {gameStatus === "OPEN" && (
            <Button
              variant="destructive"
              className="gap-2"
              onClick={() => setShowLockDialog(true)}
              disabled={isLocking}
            >
              <Lock className="h-4 w-4" />
              {isLocking ? "Locking..." : "Lock Grid & Generate Numbers"}
            </Button>
          )}
          {gameStatus === "LOCKED" && (
            <Button variant="outline" disabled className="gap-2 bg-green-50 text-green-700 border-green-200">
              <Lock className="h-4 w-4" />
              Grid Locked
            </Button>
          )}
          <Button variant="outline" disabled className="gap-2">
            <Mail className="h-4 w-4" />
            Send Reminders
          </Button>
          <Button variant="outline" disabled className="gap-2">
            <Download className="h-4 w-4" />
            Export Data
          </Button>
        </CardContent>
      </Card>

      {/* Lock Grid Confirmation Dialog */}
      <AlertDialog open={showLockDialog} onOpenChange={setShowLockDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Lock Grid & Generate Numbers?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>This action <strong>cannot be undone</strong>. Once locked:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Random numbers (0-9) will be assigned to rows and columns</li>
                  <li>Players will no longer be able to select new squares</li>
                  <li>The grid becomes final for the game</li>
                </ul>

                {!isGridFull && (
                  <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-yellow-800 dark:text-yellow-200 font-medium flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Grid is not full!
                    </p>
                    <p className="text-yellow-700 dark:text-yellow-300 text-sm mt-1">
                      {availableSquares} squares are still available. {reservedSquares > 0 && `${reservedSquares} are pending payment.`}
                    </p>
                  </div>
                )}

                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium">Current status:</p>
                  <div className="flex gap-4 mt-1 text-sm">
                    <span>{confirmedSquares} confirmed</span>
                    <span>{reservedSquares} pending</span>
                    <span>{availableSquares} available</span>
                  </div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLockGrid}
              className="bg-red-600 hover:bg-red-700"
              disabled={isLocking}
            >
              {isLocking ? "Locking..." : "Yes, Lock Grid"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

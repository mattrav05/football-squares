"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2, AlertTriangle } from "lucide-react";

interface DeleteGameButtonProps {
  gameId: string;
  gameName: string;
  playerCount: number;
  squaresClaimed: number;
}

export function DeleteGameButton({
  gameId,
  gameName,
  playerCount,
  squaresClaimed,
}: DeleteGameButtonProps) {
  const router = useRouter();
  const [showDialog, setShowDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/games/${gameId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.message || "Failed to delete game");
        return;
      }

      toast.success("Game deleted");
      router.push("/dashboard");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsDeleting(false);
      setShowDialog(false);
    }
  };

  const isConfirmValid = confirmText === "DELETE";

  return (
    <>
      <Button
        variant="destructive"
        onClick={() => setShowDialog(true)}
        className="gap-2"
      >
        <Trash2 className="h-4 w-4" />
        Delete Game
      </Button>

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Delete Game Permanently?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>
                  You are about to delete <strong>{gameName}</strong>. This action{" "}
                  <strong>cannot be undone</strong>.
                </p>

                {(playerCount > 0 || squaresClaimed > 0) && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-red-800 dark:text-red-200 font-medium flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      This game has activity!
                    </p>
                    <ul className="text-red-700 dark:text-red-300 text-sm mt-2 space-y-1">
                      {playerCount > 0 && (
                        <li>• {playerCount} player(s) have joined</li>
                      )}
                      {squaresClaimed > 0 && (
                        <li>• {squaresClaimed} square(s) have been claimed</li>
                      )}
                    </ul>
                  </div>
                )}

                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-2">This will permanently delete:</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• All game data and settings</li>
                    <li>• All player reservations and confirmations</li>
                    <li>• All payment records for this game</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    Type <span className="font-mono bg-muted px-1 rounded">DELETE</span> to confirm:
                  </p>
                  <Input
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                    placeholder="Type DELETE"
                    className="font-mono"
                  />
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmText("")}>
              Cancel
            </AlertDialogCancel>
            <Button
              onClick={handleDelete}
              disabled={!isConfirmValid || isDeleting}
              variant="destructive"
            >
              {isDeleting ? "Deleting..." : "Delete Game Forever"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Users, MoreVertical, Shield, ShieldOff, Trash2, RotateCcw } from "lucide-react";

interface Player {
  id: string;
  userId: string;
  role: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface Square {
  id: string;
  status: string;
  playerId: string | null;
}

interface PlayerManagementProps {
  gameId: string;
  players: Player[];
  squares: Square[];
  managerId: string;
}

export function PlayerManagement({ gameId, players, squares, managerId }: PlayerManagementProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    action: () => Promise<void>;
  } | null>(null);

  const handleAction = async (playerId: string, action: string, role?: string) => {
    setIsLoading(playerId);
    try {
      const response = await fetch(`/api/games/${gameId}/players`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, action, role }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.message || "Action failed");
        return;
      }

      const result = await response.json();
      toast.success(result.message);
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(null);
      setConfirmDialog(null);
    }
  };

  const getPlayerStats = (userId: string) => {
    const playerSquares = squares.filter((s) => s.playerId === userId);
    return {
      reserved: playerSquares.filter((s) => s.status === "RESERVED").length,
      confirmed: playerSquares.filter((s) => s.status === "CONFIRMED").length,
      total: playerSquares.length,
    };
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle>Players ({players.length})</CardTitle>
              <CardDescription>Manage player roles and squares</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {players.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No players have joined yet.</p>
          ) : (
            <div className="space-y-2">
              {players.map((gp) => {
                const stats = getPlayerStats(gp.userId);
                const isManager = gp.userId === managerId;

                return (
                  <div
                    key={gp.id}
                    className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{gp.user.name}</p>
                        {isManager && (
                          <Badge variant="secondary" className="text-xs">Owner</Badge>
                        )}
                        {gp.role === "CO_MANAGER" && (
                          <Badge className="bg-purple-500 text-xs">Co-Manager</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{gp.user.email}</p>
                    </div>

                    <div className="flex items-center gap-3 ml-4">
                      {/* Stats badges */}
                      <div className="hidden sm:flex items-center gap-2">
                        {stats.reserved > 0 && (
                          <Badge variant="outline" className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200">
                            {stats.reserved} pending
                          </Badge>
                        )}
                        {stats.confirmed > 0 && (
                          <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200">
                            {stats.confirmed} confirmed
                          </Badge>
                        )}
                        {stats.total === 0 && (
                          <Badge variant="outline" className="text-muted-foreground">
                            No squares
                          </Badge>
                        )}
                      </div>

                      {/* Mobile stats */}
                      <div className="flex sm:hidden">
                        <Badge variant="outline">
                          {stats.total} sq
                        </Badge>
                      </div>

                      {/* Actions dropdown */}
                      {!isManager && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              disabled={isLoading === gp.userId}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            {gp.role === "PLAYER" ? (
                              <DropdownMenuItem
                                onClick={() => handleAction(gp.userId, "setRole", "CO_MANAGER")}
                              >
                                <Shield className="h-4 w-4 mr-2 text-purple-500" />
                                Make Co-Manager
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => handleAction(gp.userId, "setRole", "PLAYER")}
                              >
                                <ShieldOff className="h-4 w-4 mr-2" />
                                Remove Co-Manager
                              </DropdownMenuItem>
                            )}

                            {stats.reserved > 0 && (
                              <DropdownMenuItem
                                onClick={() =>
                                  setConfirmDialog({
                                    open: true,
                                    title: "Release Reserved Squares",
                                    description: `This will release ${stats.reserved} reserved square(s) for ${gp.user.name} back to the pool. They will need to reselect them.`,
                                    action: () => handleAction(gp.userId, "releaseSquares"),
                                  })
                                }
                              >
                                <RotateCcw className="h-4 w-4 mr-2 text-orange-500" />
                                Release Pending ({stats.reserved})
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600"
                              onClick={() =>
                                setConfirmDialog({
                                  open: true,
                                  title: "Remove Player",
                                  description: `This will remove ${gp.user.name} from the game and release all their squares (${stats.total} total). This cannot be undone.`,
                                  action: () => handleAction(gp.userId, "removePlayer"),
                                })
                              }
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove from Game
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog
        open={confirmDialog?.open ?? false}
        onOpenChange={(open) => !open && setConfirmDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog?.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmDialog?.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDialog?.action()}
              className="bg-red-600 hover:bg-red-700"
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

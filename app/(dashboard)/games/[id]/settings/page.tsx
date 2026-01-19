import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDate } from "@/lib/utils";

interface SettingsPageProps {
  params: Promise<{ id: string }>;
}

async function getGameForManager(id: string, userId: string) {
  return prisma.game.findUnique({
    where: { id, managerId: userId },
  });
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const game = await getGameForManager(id, session.user.id);

  if (!game) {
    notFound();
  }

  async function updateGame(formData: FormData) {
    "use server";

    const sess = await auth();
    if (!sess?.user?.id) return;

    const name = formData.get("name") as string;
    const pricePerSquare = formData.get("pricePerSquare") as string;
    const maxSquaresPerPlayer = formData.get("maxSquaresPerPlayer") as string;
    const colorPrimary = formData.get("colorPrimary") as string;
    const colorSecondary = formData.get("colorSecondary") as string;

    await prisma.game.update({
      where: { id, managerId: sess.user.id },
      data: {
        name,
        pricePerSquare: pricePerSquare ? parseFloat(pricePerSquare) : null,
        maxSquaresPerPlayer: parseInt(maxSquaresPerPlayer) || 10,
        colorPrimary,
        colorSecondary,
      },
    });

    redirect(`/games/${id}`);
  }

  async function deleteGame() {
    "use server";

    const sess = await auth();
    if (!sess?.user?.id) return;

    await prisma.game.delete({
      where: { id, managerId: sess.user.id },
    });

    redirect("/dashboard");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Game Settings</h1>
          <p className="text-muted-foreground">{game.name}</p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/games/${game.id}`}>Back to Game</Link>
        </Button>
      </div>

      {/* Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle>Game Details</CardTitle>
          <CardDescription>
            Update your game settings. Some settings cannot be changed after
            players have joined.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updateGame} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Game Name</Label>
              <Input id="name" name="name" defaultValue={game.name} required />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="pricePerSquare">Price Per Square</Label>
                <Input
                  id="pricePerSquare"
                  name="pricePerSquare"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={game.pricePerSquare?.toString() || ""}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxSquaresPerPlayer">Max Squares/Player</Label>
                <Input
                  id="maxSquaresPerPlayer"
                  name="maxSquaresPerPlayer"
                  type="number"
                  min="1"
                  max="100"
                  defaultValue={game.maxSquaresPerPlayer}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="colorPrimary">Primary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="colorPrimary"
                    name="colorPrimary"
                    type="color"
                    defaultValue={game.colorPrimary}
                    className="h-10 w-16"
                  />
                  <Input
                    name="colorPrimaryHex"
                    defaultValue={game.colorPrimary}
                    disabled
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="colorSecondary">Secondary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="colorSecondary"
                    name="colorSecondary"
                    type="color"
                    defaultValue={game.colorSecondary}
                    className="h-10 w-16"
                  />
                  <Input
                    name="colorSecondaryHex"
                    defaultValue={game.colorSecondary}
                    disabled
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            <Button type="submit">Save Changes</Button>
          </form>
        </CardContent>
      </Card>

      {/* Game Info (Read-only) */}
      <Card>
        <CardHeader>
          <CardTitle>Game Information</CardTitle>
          <CardDescription>
            These settings cannot be changed after game creation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-muted-foreground">Home Team</Label>
              <p className="font-medium">{game.teamHome}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Away Team</Label>
              <p className="font-medium">{game.teamAway}</p>
            </div>
          </div>
          <div>
            <Label className="text-muted-foreground">Game Date</Label>
            <p className="font-medium">{formatDate(game.gameDate)}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Entry Code</Label>
            <p className="font-mono font-medium">{game.entryCode}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Status</Label>
            <p className="font-medium capitalize">{game.status.toLowerCase()}</p>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200 dark:border-red-900">
        <CardHeader>
          <CardTitle className="text-red-600">Danger Zone</CardTitle>
          <CardDescription>
            These actions cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={deleteGame}>
            <Button type="submit" variant="destructive">
              Delete Game
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

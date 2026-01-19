import { CreateGameForm } from "@/components/forms/create-game-form";
import { LegalDisclaimer } from "@/components/shared/legal-disclaimer";

export const metadata = {
  title: "Create Game - Football Squares",
  description: "Create a new football squares game",
};

export default function CreateGamePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Create a New Game</h1>
        <p className="text-muted-foreground mt-2">
          Set up your football squares game and invite players to join.
        </p>
      </div>

      <LegalDisclaimer variant="prominent" />

      <CreateGameForm />
    </div>
  );
}

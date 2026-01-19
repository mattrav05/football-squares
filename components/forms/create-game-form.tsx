"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createGameSchema, type CreateGameInput } from "@/lib/validations";

const COLOR_PRESETS = [
  { name: "Classic Blue", primary: "#3b82f6", secondary: "#10b981" },
  { name: "Chiefs Red", primary: "#e31837", secondary: "#ffb81c" },
  { name: "Eagles Green", primary: "#004c54", secondary: "#a5acaf" },
  { name: "Cowboys Blue", primary: "#003594", secondary: "#869397" },
  { name: "49ers Red", primary: "#aa0000", secondary: "#b3995d" },
  { name: "Ravens Purple", primary: "#241773", secondary: "#9e7c0c" },
];

export function CreateGameForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<CreateGameInput>({
    resolver: zodResolver(createGameSchema),
    defaultValues: {
      name: "",
      gameDate: "",
      teamHome: "",
      teamAway: "",
      pricePerSquare: undefined,
      payoutQ1: 10,
      payoutQ2: 20,
      payoutQ3: 20,
      payoutFinal: 50,
      reservationHours: 24,
      maxSquaresPerPlayer: 10,
      colorPrimary: "#3b82f6",
      colorSecondary: "#10b981",
    },
  });

  const payoutTotal =
    (form.watch("payoutQ1") || 0) +
    (form.watch("payoutQ2") || 0) +
    (form.watch("payoutQ3") || 0) +
    (form.watch("payoutFinal") || 0);

  async function onSubmit(data: CreateGameInput) {
    setIsLoading(true);

    try {
      const response = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.message || "Failed to create game");
        return;
      }

      const game = await response.json();
      toast.success("Game created successfully!");
      router.push(`/games/${game.id}`);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  function applyColorPreset(primary: string, secondary: string) {
    form.setValue("colorPrimary", primary);
    form.setValue("colorSecondary", secondary);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Game Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Game Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Super Bowl LVIII Squares" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="teamHome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Home Team</FormLabel>
                    <FormControl>
                      <Input placeholder="Kansas City Chiefs" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="teamAway"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Away Team</FormLabel>
                    <FormControl>
                      <Input placeholder="San Francisco 49ers" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="gameDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Game Date & Time</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pricePerSquare"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price Per Square (optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="10.00"
                      value={field.value ?? ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        field.onChange(val === "" ? undefined : parseFloat(val));
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Display price for your players. You collect payments offline.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Payout Structure */}
        <Card>
          <CardHeader>
            <CardTitle>Payout Structure</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Set the percentage of the pot for each quarter. Must total 100%.
            </p>

            <div className="grid gap-4 sm:grid-cols-4">
              <FormField
                control={form.control}
                name="payoutQ1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Q1 (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={field.value}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="payoutQ2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Q2 (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={field.value}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="payoutQ3"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Q3 (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={field.value}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="payoutFinal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Final (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={field.value}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <p
              className={`text-sm font-medium ${
                payoutTotal === 100 ? "text-green-600" : "text-red-600"
              }`}
            >
              Total: {payoutTotal}% {payoutTotal !== 100 && "(must equal 100%)"}
            </p>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="reservationHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reservation Expiry (hours)</FormLabel>
                    <Select
                      onValueChange={(v) => field.onChange(parseInt(v))}
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select hours" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="12">12 hours</SelectItem>
                        <SelectItem value="24">24 hours</SelectItem>
                        <SelectItem value="48">48 hours</SelectItem>
                        <SelectItem value="72">72 hours</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Unpaid squares are released after this time.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxSquaresPerPlayer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Squares Per Player</FormLabel>
                    <Select
                      onValueChange={(v) => field.onChange(parseInt(v))}
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select max" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="5">5 squares</SelectItem>
                        <SelectItem value="10">10 squares</SelectItem>
                        <SelectItem value="15">15 squares</SelectItem>
                        <SelectItem value="20">20 squares</SelectItem>
                        <SelectItem value="100">Unlimited</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Colors */}
        <Card>
          <CardHeader>
            <CardTitle>Theme Colors</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => applyColorPreset(preset.primary, preset.secondary)}
                  className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm hover:bg-muted transition-colors"
                >
                  <div
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: preset.primary }}
                  />
                  <div
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: preset.secondary }}
                  />
                  <span>{preset.name}</span>
                </button>
              ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="colorPrimary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary Color</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input type="color" className="h-10 w-16" {...field} />
                      </FormControl>
                      <Input
                        value={field.value}
                        onChange={field.onChange}
                        className="flex-1"
                      />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="colorSecondary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Secondary Color</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input type="color" className="h-10 w-16" {...field} />
                      </FormControl>
                      <Input
                        value={field.value}
                        onChange={field.onChange}
                        className="flex-1"
                      />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
          {isLoading ? "Creating Game..." : "Create Game"}
        </Button>
      </form>
    </Form>
  );
}

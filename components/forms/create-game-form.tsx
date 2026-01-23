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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { createGameSchema, type CreateGameInput } from "@/lib/validations";
import { Calendar, DollarSign, Settings, Palette, Trophy, Users, Clock, CheckCircle, Grid3X3, Timer, TimerOff } from "lucide-react";
import { cn } from "@/lib/utils";

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
      autoReleaseEnabled: true,
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
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Grid3X3 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Game Details</CardTitle>
                <CardDescription>Basic information about your squares game</CardDescription>
              </div>
            </div>
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

            {/* Teams with visual diagram */}
            <div className="rounded-lg border p-4 bg-muted/30 mb-2">
              <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wider">How the grid works</p>
              <div className="flex items-start gap-4">
                <div className="text-xs text-center">
                  <div className="w-24 h-6 bg-secondary/30 rounded-t flex items-center justify-center font-medium border-b">
                    Column Team →
                  </div>
                  <div className="flex">
                    <div className="w-6 h-16 bg-primary/30 rounded-l flex items-center justify-center font-medium border-r" style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>
                      Row ↓
                    </div>
                    <div className="grid grid-cols-3 gap-0.5 p-1 bg-muted/50">
                      {[...Array(9)].map((_, i) => (
                        <div key={i} className="w-5 h-5 bg-background rounded-sm border" />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex-1 text-sm text-muted-foreground">
                  <p className="mb-2">Each square is where the two team scores intersect:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li><strong>Row Team</strong> score = left side numbers</li>
                    <li><strong>Column Team</strong> score = top numbers</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="teamHome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-sm bg-primary" />
                      Row Team
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Kansas City Chiefs" {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Their score determines the row (left side)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="teamAway"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-sm bg-secondary" />
                      Column Team
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="San Francisco 49ers" {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Their score determines the column (top)
                    </FormDescription>
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
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                <Trophy className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <CardTitle>Payout Structure</CardTitle>
                <CardDescription>Set the percentage of the pot for each quarter</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">

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

            <div
              className={cn(
                "flex items-center gap-2 rounded-lg p-3 text-sm font-medium",
                payoutTotal === 100
                  ? "bg-green-500/10 text-green-700 dark:text-green-400"
                  : "bg-red-500/10 text-red-700 dark:text-red-400"
              )}
            >
              {payoutTotal === 100 ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <Clock className="h-4 w-4" />
              )}
              <span>
                Total: {payoutTotal}%
                {payoutTotal !== 100 && " (must equal 100%)"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
                <Settings className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <CardTitle>Game Settings</CardTitle>
                <CardDescription>Configure reservation rules and limits</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Auto-Release Toggle */}
            <FormField
              control={form.control}
              name="autoReleaseEnabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      {field.value ? (
                        <Timer className="h-4 w-4 text-orange-500" />
                      ) : (
                        <TimerOff className="h-4 w-4 text-muted-foreground" />
                      )}
                      <FormLabel className="text-base">Auto-Release Unpaid Squares</FormLabel>
                    </div>
                    <FormDescription>
                      {field.value
                        ? "Squares that aren't paid for will be automatically released back to the pool"
                        : "Squares will remain reserved until manually released by the manager"}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Reservation Hours Slider - only shown when auto-release is enabled */}
            {form.watch("autoReleaseEnabled") && (
              <FormField
                control={form.control}
                name="reservationHours"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Time Before Auto-Release</FormLabel>
                      <span className="text-sm font-medium text-primary">
                        {field.value} hours
                      </span>
                    </div>
                    <FormControl>
                      <Slider
                        min={1}
                        max={168}
                        step={1}
                        value={[field.value]}
                        onValueChange={(value) => field.onChange(value[0])}
                        className="py-4"
                      />
                    </FormControl>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>1 hour</span>
                      <span>1 day</span>
                      <span>3 days</span>
                      <span>1 week</span>
                    </div>
                    <FormDescription>
                      Reserved squares will be released back to the pool if payment isn&apos;t confirmed within this time.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Max Squares Per Player */}
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
          </CardContent>
        </Card>

        {/* Colors */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                <Palette className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <CardTitle>Theme Colors</CardTitle>
                <CardDescription>Choose team colors for your grid</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Color Preview */}
            <div className="rounded-lg border p-4 bg-muted/30">
              <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wider">Preview</p>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div
                    className="h-8 rounded-t-md flex items-center justify-center text-xs font-semibold text-white"
                    style={{ backgroundColor: form.watch("colorPrimary") }}
                  >
                    ROW TEAM
                  </div>
                  <div
                    className="h-8 rounded-b-md flex items-center justify-center text-xs font-semibold text-white"
                    style={{ backgroundColor: form.watch("colorSecondary") }}
                  >
                    COLUMN TEAM
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {[...Array(9)].map((_, i) => (
                    <div
                      key={i}
                      className="w-6 h-6 rounded-sm border"
                      style={{
                        backgroundColor: i % 2 === 0
                          ? `${form.watch("colorPrimary")}20`
                          : `${form.watch("colorSecondary")}20`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-3">Quick Presets</p>
              <div className="flex flex-wrap gap-2">
                {COLOR_PRESETS.map((preset) => {
                  const isSelected =
                    form.watch("colorPrimary") === preset.primary &&
                    form.watch("colorSecondary") === preset.secondary;
                  return (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => applyColorPreset(preset.primary, preset.secondary)}
                      className={cn(
                        "flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-all",
                        isSelected
                          ? "border-primary bg-primary/10 ring-2 ring-primary ring-offset-2"
                          : "hover:bg-muted"
                      )}
                    >
                      <div
                        className="h-4 w-4 rounded-full ring-1 ring-black/10"
                        style={{ backgroundColor: preset.primary }}
                      />
                      <div
                        className="h-4 w-4 rounded-full ring-1 ring-black/10"
                        style={{ backgroundColor: preset.secondary }}
                      />
                      <span>{preset.name}</span>
                      {isSelected && <CheckCircle className="h-3 w-3 text-primary" />}
                    </button>
                  );
                })}
              </div>
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

        <div className="sticky bottom-4 pt-4">
          <Button
            type="submit"
            size="lg"
            className="w-full h-14 text-lg font-semibold shadow-lg"
            disabled={isLoading || payoutTotal !== 100}
          >
            {isLoading ? (
              <>
                <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Creating Game...
              </>
            ) : (
              <>
                <Grid3X3 className="mr-2 h-5 w-5" />
                Create Game
              </>
            )}
          </Button>
          {payoutTotal !== 100 && (
            <p className="text-center text-sm text-destructive mt-2">
              Payout percentages must total 100% to create the game
            </p>
          )}
        </div>
      </form>
    </Form>
  );
}

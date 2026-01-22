import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().optional(),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms of service",
  }),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const createGameSchema = z.object({
  name: z.string().min(3, "Game name must be at least 3 characters"),
  gameDate: z.string().min(1, "Game date is required"),
  teamHome: z.string().min(1, "Home team is required"),
  teamAway: z.string().min(1, "Away team is required"),
  pricePerSquare: z.number().min(0).optional(),
  payoutQ1: z.number().min(0).max(100),
  payoutQ2: z.number().min(0).max(100),
  payoutQ3: z.number().min(0).max(100),
  payoutFinal: z.number().min(0).max(100),
  reservationHours: z.number().min(1).max(168),
  autoReleaseEnabled: z.boolean(),
  maxSquaresPerPlayer: z.number().min(1).max(100),
  colorPrimary: z.string(),
  colorSecondary: z.string(),
}).refine(
  (data) => data.payoutQ1 + data.payoutQ2 + data.payoutQ3 + data.payoutFinal === 100,
  { message: "Payouts must total 100%", path: ["payoutQ1"] }
);

export const selectSquareSchema = z.object({
  gameId: z.string(),
  squares: z.array(
    z.object({
      rowIndex: z.number().min(0).max(9),
      colIndex: z.number().min(0).max(9),
    })
  ),
});

export const confirmPaymentSchema = z.object({
  gameId: z.string(),
  squareIds: z.array(z.string()),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateGameInput = z.infer<typeof createGameSchema>;
export type SelectSquareInput = z.infer<typeof selectSquareSchema>;
export type ConfirmPaymentInput = z.infer<typeof confirmPaymentSchema>;

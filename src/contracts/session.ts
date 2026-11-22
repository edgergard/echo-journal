import * as z from "zod";

export const DEMO_USER_ID = "demo";

export const SessionSchema = z.object({
  userId: z.string().min(1),
  /** null for the demo account in demo mode. */
  email: z.email().nullable(),
  isDemo: z.boolean(),
});
export type Session = z.infer<typeof SessionSchema>;

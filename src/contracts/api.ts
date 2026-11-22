import * as z from "zod";

/** POST /api/reflect body. */
export const ReflectRequestSchema = z.object({
  entryId: z.string().min(1),
  regenerate: z.boolean().optional(),
});
export type ReflectRequest = z.infer<typeof ReflectRequestSchema>;

/** Response headers of POST /api/reflect. */
export const REFLECT_STATUS_HEADER = "x-echo-status";
export const REFLECT_RECALLED_HEADER = "x-echo-recalled";
export const ReflectStreamStatusSchema = z.enum([
  "streaming",
  "done",
  "crisis",
  "limit",
]);
export type ReflectStreamStatus = z.infer<typeof ReflectStreamStatusSchema>;

/** GET /api/week query. weekStart is a Monday (UTC). */
export const WeekQuerySchema = z.object({ weekStart: z.iso.date() });

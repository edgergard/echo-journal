import type { NextRequest } from "next/server";

import { WeekQuerySchema } from "@/contracts/api";

/**
 * GET ?weekStart=YYYY-MM-DD → WeekSummary JSON (src/contracts/journal.ts).
 * Stub — stream 1-week implements it.
 */
export async function GET(request: NextRequest) {
  const parsed = WeekQuerySchema.safeParse({
    weekStart: request.nextUrl.searchParams.get("weekStart"),
  });
  if (!parsed.success) {
    return Response.json({ error: "Invalid weekStart" }, { status: 400 });
  }
  return Response.json({ error: "Not implemented" }, { status: 501 });
}

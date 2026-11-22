import type { NextRequest } from "next/server";

import { WeekQuerySchema } from "@/contracts/api";
import { getBackend } from "@/server/backend";
import { buildWeekData } from "@/server/week/build-week-summary";
import { resolveWeekStart } from "@/server/week/week-utils";

/** GET ?weekStart=YYYY-MM-DD → WeekSummary JSON (src/contracts/journal.ts). */
export async function GET(request: NextRequest) {
  const parsed = WeekQuerySchema.safeParse({
    weekStart: request.nextUrl.searchParams.get("weekStart"),
  });
  if (!parsed.success) {
    return Response.json({ error: "Invalid weekStart" }, { status: 400 });
  }

  const backend = getBackend();
  const session = await backend.auth.getSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const weekStart = resolveWeekStart(parsed.data.weekStart);
  const { summary } = await buildWeekData(backend, session.userId, weekStart);
  return Response.json(summary, { headers: { "Cache-Control": "no-store" } });
}

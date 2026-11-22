"use server";

import { routes } from "@/lib/routes";
import { requireSession } from "@/server/auth/require-session";
import { getBackend } from "@/server/backend";
import { buildWeekData, type WeekData } from "@/server/week/build-week-summary";
import { resolveWeekStart } from "@/server/week/week-utils";

/** "Refresh summary" / "Try again": rebuilds the week (one AI unit). */
export async function refreshWeek(weekStart: string): Promise<WeekData> {
  const session = await requireSession(routes.week(weekStart));
  return buildWeekData(
    getBackend(),
    session.userId,
    resolveWeekStart(weekStart),
  );
}

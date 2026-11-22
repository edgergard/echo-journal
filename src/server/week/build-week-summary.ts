import "server-only";

import type { Backend } from "@/contracts/backend";
import type { Entry, WeekSummary } from "@/contracts/journal";
import { buildMoodSeries, filterWeekEntries } from "@/server/week/week-utils";

const PAGE_SIZE = 100;
const MAX_PAGES = 20;

/** The week's entries: pages back from newest until older than the week. */
export async function loadWeekEntries(
  backend: Pick<Backend, "entries">,
  userId: string,
  weekStart: string,
): Promise<Entry[]> {
  const startIso = `${weekStart}T00:00:00.000Z`;
  const collected: Entry[] = [];
  let before: string | undefined;
  for (let page = 0; page < MAX_PAGES; page++) {
    const result = await backend.entries.list(userId, {
      before,
      limit: PAGE_SIZE,
    });
    collected.push(...result.entries);
    const oldest = result.entries.at(-1);
    if (!result.nextBefore || !oldest || oldest.createdAt < startIso) break;
    before = result.nextBefore;
  }
  return filterWeekEntries(collected, weekStart);
}

export interface WeekData {
  summary: WeekSummary;
  /** createdAt (ISO) of every entry in the week, by id — for link labels. */
  entryDates: Record<string, string>;
}

/** Builds the week's mood series and, with ≥ 2 entries, the AI themes. */
export async function buildWeekData(
  backend: Backend,
  userId: string,
  weekStart: string,
  now: Date = new Date(),
): Promise<WeekData> {
  const entries = await loadWeekEntries(backend, userId, weekStart);
  const entryDates = Object.fromEntries(
    entries.map((e) => [e.id, e.createdAt]),
  );
  const base = {
    weekStart,
    days: buildMoodSeries(entries, weekStart),
    entryCount: entries.length,
    generatedAt: now.toISOString(),
  };

  if (entries.length < 2) {
    return { summary: { ...base, status: "empty", themes: [] }, entryDates };
  }

  const usage = await backend.usage.consume(userId);
  if (!usage.allowed) {
    return { summary: { ...base, status: "limit", themes: [] }, entryDates };
  }

  try {
    const themes = (await backend.ai.summarizeWeek(entries))
      .slice(0, 5)
      .map((theme) => ({
        ...theme,
        entryIds: theme.entryIds.filter((id) => id in entryDates),
      }));
    return {
      summary: { ...base, status: "done", themes },
      entryDates,
    };
  } catch {
    return { summary: { ...base, status: "error", themes: [] }, entryDates };
  }
}

import "server-only";

import type { Backend } from "@/contracts/backend";
import type { Entry, WeekSummary, WeekTheme } from "@/contracts/journal";
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

interface CachedThemes {
  fingerprint: string;
  themes: WeekTheme[];
}

/** In-process themes cache, one slot per user + week. */
const themesCache = new Map<string, CachedThemes>();
const CACHE_MAX = 500;

/** Changes whenever an entry of the week is added, removed or edited. */
export function entriesFingerprint(entries: Entry[]): string {
  return entries
    .map((e) => `${e.id}@${e.updatedAt}`)
    .sort()
    .join("|");
}

export function clearWeekThemesCache(): void {
  themesCache.clear();
}

export interface BuildWeekOptions {
  now?: Date;
  /** Skip the cache and regenerate ("Refresh summary"). */
  force?: boolean;
}

/**
 * Builds the week's mood series and, with ≥ 2 entries, the AI themes. Themes
 * are cached per user + week + entries fingerprint; a unit of the daily limit
 * is consumed only on a miss or when `force` is set.
 */
export async function buildWeekData(
  backend: Backend,
  userId: string,
  weekStart: string,
  { now = new Date(), force = false }: BuildWeekOptions = {},
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

  const cacheKey = `${userId}:${weekStart}`;
  const fingerprint = entriesFingerprint(entries);
  const cached = themesCache.get(cacheKey);
  if (!force && cached && cached.fingerprint === fingerprint) {
    return {
      summary: { ...base, status: "done", themes: cached.themes },
      entryDates,
    };
  }

  // Check the limit first, but use a unit only after the model succeeded, so a
  // rate-limited (429) or failed call costs nothing — same rule as replies.
  if ((await backend.usage.remaining(userId)) <= 0) {
    return { summary: { ...base, status: "limit", themes: [] }, entryDates };
  }

  try {
    const themes = (await backend.ai.summarizeWeek(entries))
      .slice(0, 5)
      .map((theme) => ({
        ...theme,
        entryIds: theme.entryIds.filter((id) => id in entryDates),
      }));
    const usage = await backend.usage.consume(userId);
    if (!usage.allowed) {
      // Another request took the last unit meanwhile.
      return { summary: { ...base, status: "limit", themes: [] }, entryDates };
    }
    if (themesCache.size >= CACHE_MAX && !themesCache.has(cacheKey)) {
      const oldest = themesCache.keys().next().value;
      if (oldest !== undefined) themesCache.delete(oldest);
    }
    themesCache.set(cacheKey, { fingerprint, themes });
    return {
      summary: { ...base, status: "done", themes },
      entryDates,
    };
  } catch (error) {
    console.error("[week] summarizeWeek failed", error);
    themesCache.delete(cacheKey);
    return { summary: { ...base, status: "error", themes: [] }, entryDates };
  }
}

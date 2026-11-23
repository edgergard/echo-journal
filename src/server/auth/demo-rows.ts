import "server-only";

import type { Mood, RecalledRef, ReflectionStatus } from "@/contracts/journal";
import type { DemoSeed } from "@/server/demo/seed";

/** Row of `entries` (supabase/migrations/0001_init.sql). */
export interface EntryRow {
  id: string;
  user_id: string;
  text: string;
  mood: Mood;
  created_at: string;
  updated_at: string;
}

/** Row of `reflections`. */
export interface ReflectionRow {
  entry_id: string;
  user_id: string;
  status: ReflectionStatus;
  text: string;
  recalled: RecalledRef[];
  created_at: string;
}

/**
 * Maps the demo seed to database rows for one user. Seed ids ("demo-e01")
 * become fresh ids from `newId` (uuid columns), recalled refs included.
 */
export function buildDemoRows(
  seed: DemoSeed,
  userId: string,
  newId: () => string,
): { entries: EntryRow[]; reflections: ReflectionRow[] } {
  const ids = new Map(seed.entries.map((entry) => [entry.id, newId()]));
  const idFor = (seedId: string) => {
    const id = ids.get(seedId);
    if (!id) throw new Error(`Unknown demo entry ${seedId}`);
    return id;
  };

  return {
    entries: seed.entries.map((entry) => ({
      id: idFor(entry.id),
      user_id: userId,
      text: entry.text,
      mood: entry.mood,
      created_at: entry.createdAt,
      updated_at: entry.updatedAt,
    })),
    reflections: seed.reflections.map((reflection) => ({
      entry_id: idFor(reflection.entryId),
      user_id: userId,
      status: reflection.status,
      text: reflection.text,
      recalled: reflection.recalled.map((ref) => ({
        ...ref,
        entryId: idFor(ref.entryId),
      })),
      created_at: reflection.createdAt,
    })),
  };
}

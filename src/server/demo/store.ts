import "server-only";

import type { Entry, Reflection } from "@/contracts/journal";
import { DEMO_USER_ID } from "@/contracts/session";

import { buildDemoSeed } from "./seed";

/**
 * The in-memory data store used in demo mode (no Supabase env).
 * One per server process; lost on restart. Every domain's `memory.ts`
 * implementation reads and writes it.
 */
export interface DemoStore {
  /** userId → entries (any order; repos sort). */
  entries: Map<string, Entry[]>;
  /** userId → entryId → reflection. */
  reflections: Map<string, Map<string, Reflection>>;
  /** `${userId}:${YYYY-MM-DD}` → AI calls used that UTC day. */
  usage: Map<string, number>;
  /** userId → entryId → embedding (or any similarity features). */
  vectors: Map<string, Map<string, number[]>>;
}

const globalForStore = globalThis as unknown as { __echoDemoStore?: DemoStore };

function seedDemoUser(store: DemoStore) {
  const seed = buildDemoSeed();
  store.entries.set(DEMO_USER_ID, seed.entries);
  store.reflections.set(
    DEMO_USER_ID,
    new Map(seed.reflections.map((r) => [r.entryId, r])),
  );
  store.vectors.delete(DEMO_USER_ID);
  for (const key of store.usage.keys()) {
    if (key.startsWith(`${DEMO_USER_ID}:`)) store.usage.delete(key);
  }
}

export function getDemoStore(): DemoStore {
  if (!globalForStore.__echoDemoStore) {
    const store: DemoStore = {
      entries: new Map(),
      reflections: new Map(),
      usage: new Map(),
      vectors: new Map(),
    };
    seedDemoUser(store);
    globalForStore.__echoDemoStore = store;
  }
  return globalForStore.__echoDemoStore;
}

/** Restores the demo user's seeded data. */
export function resetDemoStore() {
  seedDemoUser(getDemoStore());
}

/** Test helper: a fresh store with only the demo seed. */
export function resetDemoStoreForTests() {
  globalForStore.__echoDemoStore = undefined;
  return getDemoStore();
}

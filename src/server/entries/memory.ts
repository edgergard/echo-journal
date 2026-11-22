import "server-only";

import type {
  EntriesPage,
  EntriesRepo,
  ListEntriesOptions,
} from "@/contracts/backend";
import type { Entry, EntryInput } from "@/contracts/journal";
import { getDemoStore } from "@/server/demo/store";

const byNewest = (a: Entry, b: Entry) => b.createdAt.localeCompare(a.createdAt);

/** Demo-mode entries repo on the in-memory store. */
export class MemoryEntriesRepo implements EntriesRepo {
  private all(userId: string): Entry[] {
    const store = getDemoStore();
    let list = store.entries.get(userId);
    if (!list) {
      list = [];
      store.entries.set(userId, list);
    }
    return list;
  }

  async list(
    userId: string,
    options: ListEntriesOptions = {},
  ): Promise<EntriesPage> {
    const limit = Math.min(Math.max(options.limit ?? 20, 1), 100);
    const before = options.before;
    const sorted = [...this.all(userId)].sort(byNewest);
    const older = before ? sorted.filter((e) => e.createdAt < before) : sorted;
    const entries = older.slice(0, limit);
    const last = entries.at(-1);
    return {
      entries,
      nextBefore: older.length > limit && last ? last.createdAt : null,
    };
  }

  async get(userId: string, id: string): Promise<Entry | null> {
    return this.all(userId).find((e) => e.id === id) ?? null;
  }

  async create(userId: string, input: EntryInput): Promise<Entry> {
    const now = new Date().toISOString();
    const entry: Entry = {
      id: crypto.randomUUID(),
      userId,
      text: input.text,
      mood: input.mood,
      createdAt: now,
      updatedAt: now,
    };
    this.all(userId).push(entry);
    return entry;
  }

  async update(
    userId: string,
    id: string,
    input: EntryInput,
  ): Promise<Entry | null> {
    const entry = this.all(userId).find((e) => e.id === id);
    if (!entry) return null;
    entry.text = input.text;
    entry.mood = input.mood;
    entry.updatedAt = new Date().toISOString();
    return { ...entry };
  }

  async remove(userId: string, id: string): Promise<boolean> {
    const list = this.all(userId);
    const index = list.findIndex((e) => e.id === id);
    if (index === -1) return false;
    list.splice(index, 1);
    const store = getDemoStore();
    store.reflections.get(userId)?.delete(id);
    store.vectors.get(userId)?.delete(id);
    return true;
  }
}

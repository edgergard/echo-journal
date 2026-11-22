import "server-only";

import type { ReflectionsRepo } from "@/contracts/backend";
import type { Reflection } from "@/contracts/journal";
import { getDemoStore } from "@/server/demo/store";

/** Demo-mode replies on the in-memory store. */
export class MemoryReflectionsRepo implements ReflectionsRepo {
  private map(userId: string) {
    const store = getDemoStore();
    let map = store.reflections.get(userId);
    if (!map) {
      map = new Map();
      store.reflections.set(userId, map);
    }
    return map;
  }

  async get(userId: string, entryId: string): Promise<Reflection | null> {
    return this.map(userId).get(entryId) ?? null;
  }

  async save(userId: string, reflection: Reflection): Promise<void> {
    this.map(userId).set(reflection.entryId, reflection);
  }

  async repliedEntryIds(
    userId: string,
    entryIds: string[],
  ): Promise<Set<string>> {
    const map = this.map(userId);
    return new Set(entryIds.filter((id) => map.get(id)?.status === "done"));
  }
}

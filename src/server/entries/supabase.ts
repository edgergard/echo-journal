import "server-only";

import type { EntriesPage, EntriesRepo } from "@/contracts/backend";
import type { Entry } from "@/contracts/journal";

const TODO = "Supabase entries repo is not implemented yet (stream 1-entries)";

/** Real-mode entries repo on Supabase. Stub — implemented by stream 1-entries. */
export class SupabaseEntriesRepo implements EntriesRepo {
  async list(): Promise<EntriesPage> {
    throw new Error(TODO);
  }
  async get(): Promise<Entry | null> {
    throw new Error(TODO);
  }
  async create(): Promise<Entry> {
    throw new Error(TODO);
  }
  async update(): Promise<Entry | null> {
    throw new Error(TODO);
  }
  async remove(): Promise<boolean> {
    throw new Error(TODO);
  }
}

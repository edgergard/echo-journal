import "server-only";

import type { ReflectionsRepo } from "@/contracts/backend";
import type { Reflection } from "@/contracts/journal";

const TODO = "Supabase reflections repo is not implemented yet (stream 1-ai)";

/** Real-mode replies on Supabase. Stub — implemented by stream 1-ai. */
export class SupabaseReflectionsRepo implements ReflectionsRepo {
  async get(): Promise<Reflection | null> {
    throw new Error(TODO);
  }
  async save(): Promise<void> {
    throw new Error(TODO);
  }
  async repliedEntryIds(): Promise<Set<string>> {
    throw new Error(TODO);
  }
}

import "server-only";

import type { MemoryStore, SimilarEntry } from "@/contracts/backend";

const TODO = "Supabase memory (pgvector) is not implemented yet (stream 1-ai)";

/** Real-mode memory on pgvector. Stub — implemented by stream 1-ai. */
export class SupabaseMemoryStore implements MemoryStore {
  async index(): Promise<void> {
    throw new Error(TODO);
  }
  async similar(): Promise<SimilarEntry[]> {
    throw new Error(TODO);
  }
  async remove(): Promise<void> {
    throw new Error(TODO);
  }
}

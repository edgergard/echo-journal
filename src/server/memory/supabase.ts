import "server-only";

import * as z from "zod";

import type { MemoryStore, SimilarEntry } from "@/contracts/backend";
import { type Entry, MoodSchema } from "@/contracts/journal";
import { env } from "@/env";
import { embedText } from "@/server/ai/openrouter";
import { createSupabaseServerClient } from "@/server/auth/supabase-client";

type Supabase = Awaited<ReturnType<typeof createSupabaseServerClient>>;

const EntryRowSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  text: z.string(),
  mood: MoodSchema,
  created_at: z.string(),
  updated_at: z.string(),
});

const MatchRowSchema = z.object({
  entry_id: z.string(),
  similarity: z.number(),
});

/** Postgres timestamptz ("…+00:00") → ISO 8601 with Z. */
const toIso = (value: string) => new Date(value).toISOString();

/**
 * Real-mode memory: OpenRouter embeddings in `entry_embeddings` (pgvector),
 * searched with the `match_entries()` RPC. Without an OpenRouter key there
 * are no embeddings, so Echo replies without recall.
 */
export class SupabaseMemoryStore implements MemoryStore {
  async index(userId: string, entry: Entry): Promise<void> {
    if (!env.OPENROUTER_API_KEY) return;
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("entry_embeddings")
      .select("updated_at")
      .eq("entry_id", entry.id)
      .maybeSingle();
    if (error) throw new Error(`Couldn't read the embedding: ${error.message}`);
    const indexedAt = data
      ? z.object({ updated_at: z.string() }).parse(data).updated_at
      : null;
    // Fresh enough: embedded after the entry's last edit.
    if (indexedAt && toIso(indexedAt) >= entry.updatedAt) return;
    await this.upsert(supabase, userId, entry.id, await embedText(entry.text));
  }

  async similar(
    userId: string,
    entry: Entry,
    k: number,
  ): Promise<SimilarEntry[]> {
    if (!env.OPENROUTER_API_KEY || k <= 0) return [];
    const supabase = await createSupabaseServerClient();
    const queryEmbedding = await this.embeddingOf(supabase, userId, entry);

    const { data: matches, error } = await supabase.rpc("match_entries", {
      query_embedding: queryEmbedding,
      exclude_entry: entry.id,
      older_than: entry.createdAt,
      match_count: k,
    });
    if (error) throw new Error(`Couldn't search memory: ${error.message}`);
    const ranked = z.array(MatchRowSchema).parse(matches);
    if (ranked.length === 0) return [];

    const { data: rows, error: entriesError } = await supabase
      .from("entries")
      .select("id, user_id, text, mood, created_at, updated_at")
      .eq("user_id", userId)
      .in(
        "id",
        ranked.map((m) => m.entry_id),
      );
    if (entriesError) {
      throw new Error(
        `Couldn't load recalled entries: ${entriesError.message}`,
      );
    }
    const byId = new Map(
      z
        .array(EntryRowSchema)
        .parse(rows)
        .map((row): [string, Entry] => [
          row.id,
          {
            id: row.id,
            userId: row.user_id,
            text: row.text,
            mood: row.mood,
            createdAt: toIso(row.created_at),
            updatedAt: toIso(row.updated_at),
          },
        ]),
    );
    return ranked.flatMap((match) => {
      const found = byId.get(match.entry_id);
      return found ? [{ entry: found, score: match.similarity }] : [];
    });
  }

  async remove(userId: string, entryId: string): Promise<void> {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("entry_embeddings")
      .delete()
      .eq("user_id", userId)
      .eq("entry_id", entryId);
    if (error)
      throw new Error(`Couldn't remove the embedding: ${error.message}`);
  }

  /** The stored embedding (pgvector text form), or a fresh one. */
  private async embeddingOf(
    supabase: Supabase,
    userId: string,
    entry: Entry,
  ): Promise<string | number[]> {
    const { data, error } = await supabase
      .from("entry_embeddings")
      .select("embedding")
      .eq("entry_id", entry.id)
      .maybeSingle();
    if (error) throw new Error(`Couldn't read the embedding: ${error.message}`);
    const stored = data
      ? z.object({ embedding: z.string() }).safeParse(data)
      : null;
    if (stored?.success) return stored.data.embedding;
    const embedding = await embedText(entry.text);
    await this.upsert(supabase, userId, entry.id, embedding);
    return embedding;
  }

  private async upsert(
    supabase: Supabase,
    userId: string,
    entryId: string,
    embedding: number[],
  ) {
    const { error } = await supabase.from("entry_embeddings").upsert(
      {
        entry_id: entryId,
        user_id: userId,
        embedding,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "entry_id" },
    );
    if (error) throw new Error(`Couldn't save the embedding: ${error.message}`);
  }
}

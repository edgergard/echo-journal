import "server-only";

import type {
  EntriesPage,
  EntriesRepo,
  ListEntriesOptions,
} from "@/contracts/backend";
import { type Entry, type EntryInput, MoodSchema } from "@/contracts/journal";
import { createSupabaseServerClient } from "@/server/auth/supabase-client";

interface EntryRow {
  id: string;
  user_id: string;
  text: string;
  mood: string;
  created_at: string;
  updated_at: string;
}

const COLUMNS = "id, user_id, text, mood, created_at, updated_at";

function toIso(value: string): string {
  return new Date(value).toISOString();
}

function toEntry(row: EntryRow): Entry {
  return {
    id: row.id,
    userId: row.user_id,
    text: row.text,
    mood: MoodSchema.parse(row.mood),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

/** Real-mode entries repo on Supabase (RLS limits rows to the caller). */
export class SupabaseEntriesRepo implements EntriesRepo {
  async list(
    userId: string,
    options: ListEntriesOptions = {},
  ): Promise<EntriesPage> {
    const limit = Math.min(Math.max(options.limit ?? 20, 1), 100);
    const supabase = await createSupabaseServerClient();
    let query = supabase
      .from("entries")
      .select(COLUMNS)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit + 1);
    if (options.before) query = query.lt("created_at", options.before);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as EntryRow[];
    const entries = rows.slice(0, limit).map(toEntry);
    const last = entries.at(-1);
    return {
      entries,
      nextBefore: rows.length > limit && last ? last.createdAt : null,
    };
  }

  async get(userId: string, id: string): Promise<Entry | null> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("entries")
      .select(COLUMNS)
      .eq("user_id", userId)
      .eq("id", id)
      .maybeSingle();
    // A malformed id is "not found", not a server error.
    if (error) {
      if (error.code === "22P02") return null;
      throw new Error(error.message);
    }
    return data ? toEntry(data as EntryRow) : null;
  }

  async create(userId: string, input: EntryInput): Promise<Entry> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("entries")
      .insert({ user_id: userId, text: input.text, mood: input.mood })
      .select(COLUMNS)
      .single();
    if (error) throw new Error(error.message);
    return toEntry(data as EntryRow);
  }

  async update(
    userId: string,
    id: string,
    input: EntryInput,
  ): Promise<Entry | null> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("entries")
      .update({
        text: input.text,
        mood: input.mood,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("id", id)
      .select(COLUMNS)
      .maybeSingle();
    if (error) {
      if (error.code === "22P02") return null;
      throw new Error(error.message);
    }
    return data ? toEntry(data as EntryRow) : null;
  }

  /** Replies and embeddings go with the entry (on delete cascade). */
  async remove(userId: string, id: string): Promise<boolean> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("entries")
      .delete()
      .eq("user_id", userId)
      .eq("id", id)
      .select("id");
    if (error) {
      if (error.code === "22P02") return false;
      throw new Error(error.message);
    }
    return (data?.length ?? 0) > 0;
  }
}

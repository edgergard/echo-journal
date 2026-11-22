import "server-only";

import * as z from "zod";

import type { ReflectionsRepo } from "@/contracts/backend";
import {
  RecalledRefSchema,
  type Reflection,
  ReflectionStatusSchema,
} from "@/contracts/journal";
import { createSupabaseServerClient } from "@/server/auth/supabase-client";

const COLUMNS = "entry_id, status, text, recalled, created_at";

const ReflectionRowSchema = z.object({
  entry_id: z.string(),
  status: ReflectionStatusSchema,
  text: z.string(),
  // A malformed jsonb value should not hide the reply itself.
  recalled: z.array(RecalledRefSchema).max(3).catch([]),
  created_at: z.string(),
});

/** Postgres timestamptz ("…+00:00") → ISO 8601 with Z. */
const toIso = (value: string) => new Date(value).toISOString();

/** Real-mode replies in the `reflections` table (RLS: own rows only). */
export class SupabaseReflectionsRepo implements ReflectionsRepo {
  async get(userId: string, entryId: string): Promise<Reflection | null> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("reflections")
      .select(COLUMNS)
      .eq("user_id", userId)
      .eq("entry_id", entryId)
      .maybeSingle();
    if (error) throw new Error(`Couldn't load the reply: ${error.message}`);
    if (!data) return null;
    const row = ReflectionRowSchema.parse(data);
    return {
      entryId: row.entry_id,
      status: row.status,
      text: row.text,
      recalled: row.recalled,
      createdAt: toIso(row.created_at),
    };
  }

  async save(userId: string, reflection: Reflection): Promise<void> {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("reflections").upsert(
      {
        entry_id: reflection.entryId,
        user_id: userId,
        status: reflection.status,
        text: reflection.text,
        recalled: reflection.recalled,
        created_at: reflection.createdAt,
      },
      { onConflict: "entry_id" },
    );
    if (error) throw new Error(`Couldn't save the reply: ${error.message}`);
  }

  async repliedEntryIds(
    userId: string,
    entryIds: string[],
  ): Promise<Set<string>> {
    if (entryIds.length === 0) return new Set();
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("reflections")
      .select("entry_id")
      .eq("user_id", userId)
      .eq("status", "done")
      .in("entry_id", entryIds);
    if (error) throw new Error(`Couldn't load replies: ${error.message}`);
    const rows = z.array(z.object({ entry_id: z.string() })).parse(data);
    return new Set(rows.map((row) => row.entry_id));
  }
}

import "server-only";

import type { EntriesRepo } from "@/contracts/backend";
import { type Entry, EntryInputSchema } from "@/contracts/journal";

export type EntryActionResult =
  { ok: true; entry: Entry } | { ok: false; error: string };

function firstIssue(error: { issues: { message: string }[] }): string {
  return error.issues[0]?.message ?? "Check your entry and try again.";
}

/** Validates the raw form input and creates the entry. */
export async function createEntryFor(
  repo: EntriesRepo,
  userId: string,
  raw: unknown,
): Promise<EntryActionResult> {
  const parsed = EntryInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  try {
    return { ok: true, entry: await repo.create(userId, parsed.data) };
  } catch {
    return {
      ok: false,
      error: "Couldn't save your entry. Your text is still here — try again.",
    };
  }
}

/** Validates the raw form input and updates the entry. */
export async function updateEntryFor(
  repo: EntriesRepo,
  userId: string,
  id: string,
  raw: unknown,
): Promise<EntryActionResult> {
  const parsed = EntryInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  try {
    const entry = await repo.update(userId, id, parsed.data);
    if (!entry) {
      return { ok: false, error: "This entry doesn't exist or was deleted." };
    }
    return { ok: true, entry };
  } catch {
    return {
      ok: false,
      error: "Couldn't save your changes. Your text is still here — try again.",
    };
  }
}

"use server";

import type { Entry } from "@/contracts/journal";
import { routes } from "@/lib/routes";
import { requireSession } from "@/server/auth/require-session";
import { getBackend } from "@/server/backend";
import {
  createEntryFor,
  type EntryActionResult,
  updateEntryFor,
} from "@/server/entries/service";

export async function createEntryAction(
  raw: unknown,
): Promise<EntryActionResult> {
  const session = await requireSession(routes.newEntry);
  return createEntryFor(getBackend().entries, session.userId, raw);
}

export async function updateEntryAction(
  id: string,
  raw: unknown,
): Promise<EntryActionResult> {
  const session = await requireSession(routes.entry(id));
  return updateEntryFor(getBackend().entries, session.userId, id, raw);
}

export async function deleteEntryAction(id: string): Promise<{ ok: boolean }> {
  const session = await requireSession(routes.entry(id));
  try {
    const removed = await getBackend().entries.remove(session.userId, id);
    if (!removed) console.warn("[entries] delete: entry not found", id);
    return { ok: removed };
  } catch (error) {
    console.error("[entries] delete failed", error);
    return { ok: false };
  }
}

export interface OlderEntriesResult {
  entries: Entry[];
  repliedIds: string[];
  nextBefore: string | null;
}

/** The next (older) page of the journal list; null when loading failed. */
export async function loadOlderEntriesAction(
  before: string,
): Promise<OlderEntriesResult | null> {
  const session = await requireSession(routes.journal);
  const backend = getBackend();
  try {
    const page = await backend.entries.list(session.userId, { before });
    const replied = await backend.reflections.repliedEntryIds(
      session.userId,
      page.entries.map((e) => e.id),
    );
    return {
      entries: page.entries,
      repliedIds: [...replied],
      nextBefore: page.nextBefore,
    };
  } catch (error) {
    console.error("[entries] load older failed", error);
    return null;
  }
}

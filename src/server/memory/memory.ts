import "server-only";

import type { MemoryStore, SimilarEntry } from "@/contracts/backend";
import type { Entry } from "@/contracts/journal";
import { getDemoStore } from "@/server/demo/store";

const STOP_WORDS = new Set([
  "about",
  "after",
  "again",
  "all",
  "and",
  "are",
  "been",
  "before",
  "but",
  "for",
  "from",
  "had",
  "has",
  "have",
  "just",
  "not",
  "out",
  "she",
  "that",
  "the",
  "them",
  "then",
  "they",
  "this",
  "was",
  "were",
  "what",
  "with",
  "you",
]);

/** Lower-cased content words of a text. */
export function contentWords(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^\p{L}\s]/gu, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w)),
  );
}

/** Jaccard overlap of content words — a keyless stand-in for embeddings. */
export function wordOverlap(a: string, b: string): number {
  const wa = contentWords(a);
  const wb = contentWords(b);
  if (wa.size === 0 || wb.size === 0) return 0;
  let shared = 0;
  for (const w of wa) if (wb.has(w)) shared += 1;
  return shared / (wa.size + wb.size - shared);
}

/** Demo-mode memory: word-overlap similarity over the user's older entries. */
export class MemoryMemoryStore implements MemoryStore {
  async index(): Promise<void> {
    // Nothing to precompute for word overlap.
  }

  async similar(
    userId: string,
    entry: Entry,
    k: number,
  ): Promise<SimilarEntry[]> {
    const all = getDemoStore().entries.get(userId) ?? [];
    return all
      .filter((e) => e.id !== entry.id && e.createdAt < entry.createdAt)
      .map((e) => ({ entry: e, score: wordOverlap(entry.text, e.text) }))
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, k);
  }

  async remove(userId: string, entryId: string): Promise<void> {
    getDemoStore().vectors.get(userId)?.delete(entryId);
  }
}

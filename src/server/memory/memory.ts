import "server-only";

import type { MemoryStore, SimilarEntry } from "@/contracts/backend";
import type { Entry } from "@/contracts/journal";
import { getDemoStore } from "@/server/demo/store";

const STOP_WORDS = new Set([
  "about",
  "after",
  "again",
  "all",
  "almost",
  "also",
  "always",
  "and",
  "another",
  "any",
  "are",
  "aren",
  "around",
  "back",
  "been",
  "before",
  "being",
  "but",
  "can",
  "could",
  "couldn",
  "day",
  "did",
  "didn",
  "does",
  "doing",
  "don",
  "down",
  "even",
  "ever",
  "every",
  "everyone",
  "everything",
  "feel",
  "felt",
  "few",
  "finally",
  "first",
  "for",
  "from",
  "get",
  "got",
  "had",
  "has",
  "hasn",
  "have",
  "haven",
  "her",
  "him",
  "his",
  "how",
  "into",
  "isn",
  "its",
  "just",
  "keep",
  "kept",
  "know",
  "last",
  "like",
  "little",
  "long",
  "lot",
  "made",
  "make",
  "many",
  "maybe",
  "more",
  "most",
  "much",
  "myself",
  "need",
  "never",
  "new",
  "next",
  "not",
  "nothing",
  "now",
  "off",
  "once",
  "one",
  "only",
  "other",
  "our",
  "out",
  "over",
  "really",
  "said",
  "same",
  "second",
  "she",
  "should",
  "shouldn",
  "some",
  "someone",
  "something",
  "spent",
  "started",
  "still",
  "tell",
  "than",
  "that",
  "the",
  "their",
  "them",
  "then",
  "there",
  "these",
  "they",
  "thing",
  "things",
  "think",
  "this",
  "time",
  "today",
  "tomorrow",
  "tonight",
  "too",
  "very",
  "want",
  "was",
  "wasn",
  "way",
  "well",
  "went",
  "were",
  "weren",
  "what",
  "when",
  "where",
  "which",
  "while",
  "who",
  "why",
  "will",
  "with",
  "won",
  "would",
  "wouldn",
  "yesterday",
  "yet",
  "you",
  "your",
]);

/** A light suffix stripper so "letters"/"letter" and "packing"/"packed" meet. */
export function stem(word: string): string {
  for (const suffix of ["ing", "ed", "es", "s"]) {
    if (word.endsWith(suffix) && word.length - suffix.length >= 3) {
      const base = word.slice(0, -suffix.length);
      // "stopped" → "stop", "running" → "run"
      const last = base.at(-1);
      return last && base.at(-2) === last && !"aeiouls".includes(last)
        ? base.slice(0, -1)
        : base;
    }
  }
  return word;
}

/**
 * A few stems that mean the same thing in a journal — a tiny stand-in for
 * what real embeddings capture (keys and values are stems).
 */
const CONCEPTS: Record<string, string> = {
  grandmother: "grandma",
  granny: "grandma",
  gran: "grandma",
  father: "dad",
  mother: "mum",
  mom: "mum",
  job: "work",
  offer: "work",
  interview: "work",
  application: "work",
  career: "work",
  office: "work",
  colleague: "work",
  boss: "work",
  mov: "move",
  apartment: "flat",
  slept: "sleep",
  insomnia: "sleep",
  jog: "run",
  ran: "run",
};

const toConcept = (word: string) => CONCEPTS[word] ?? word;

/** Stemmed, lower-cased content words of a text. */
export function contentWords(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[‘’ʼ]/g, "'")
      .replace(/'s\b/g, "")
      .replace(/[^\p{L}\s]/gu, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w))
      .map((w) => toConcept(stem(w)))
      .filter((w) => !STOP_WORDS.has(w)),
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

/**
 * Ranks `candidates` older than `entry` (excluding it) by word overlap,
 * most similar first; ties go to the more recent entry. Pure, for tests.
 */
export function rankBySimilarity(
  entry: Entry,
  candidates: Entry[],
  k: number,
): SimilarEntry[] {
  return candidates
    .filter((e) => e.id !== entry.id && e.createdAt < entry.createdAt)
    .map((e) => ({ entry: e, score: wordOverlap(entry.text, e.text) }))
    .filter((s) => s.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score || b.entry.createdAt.localeCompare(a.entry.createdAt),
    )
    .slice(0, Math.max(k, 0));
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
    return rankBySimilarity(entry, getDemoStore().entries.get(userId) ?? [], k);
  }

  async remove(userId: string, entryId: string): Promise<void> {
    getDemoStore().vectors.get(userId)?.delete(entryId);
  }
}

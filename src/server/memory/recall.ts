import "server-only";

import type { Entry, RecalledRef } from "@/contracts/journal";

import { contentWords } from "./memory";

export const QUOTE_MAX = 140;

/** Shortens text to `max` characters on a word boundary, with an ellipsis. */
export function clipQuote(text: string, max = QUOTE_MAX): string {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  const head = space > max / 2 ? cut.slice(0, space) : cut;
  return `${head.replace(/[\s,;:.!?—–-]+$/u, "")}…`;
}

/**
 * The sentence of `past` that best echoes `current` (most shared content
 * words; the first sentence wins ties), clipped to a short quote.
 */
export function pickQuote(past: string, current: string): string {
  const sentences = past
    .split(/(?<=[.!?…])\s+/u)
    .map((s) => s.trim())
    .filter(Boolean);
  const words = contentWords(current);
  let best = sentences[0] ?? past;
  let bestScore = -1;
  for (const sentence of sentences) {
    let score = 0;
    for (const w of contentWords(sentence)) if (words.has(w)) score += 1;
    if (score > bestScore) {
      best = sentence;
      bestScore = score;
    }
  }
  return clipQuote(best);
}

/** A "Recalled" margin note for a past entry Echo drew on. */
export function toRecalledRef(past: Entry, current: Entry): RecalledRef {
  return {
    entryId: past.id,
    date: past.createdAt,
    quote: pickQuote(past.text, current.text),
  };
}

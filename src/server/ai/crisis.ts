import "server-only";

/**
 * Crisis guard: phrases that suggest the writer may be in danger. A match
 * shows the crisis card instead of a model reply — no model call, no quota.
 * English only (the UI language); matched case-insensitively on word bounds.
 */
export const CRISIS_PHRASES = [
  "kill myself",
  "killing myself",
  "end my life",
  "ending my life",
  "end it all",
  "take my own life",
  "taking my own life",
  "want to die",
  "wanna die",
  "wish i was dead",
  "wish i were dead",
  "better off dead",
  "better off without me",
  "suicide",
  "suicidal",
  "hurt myself",
  "hurting myself",
  "harm myself",
  "harming myself",
  "self-harm",
  "cut myself",
  "cutting myself",
  "no reason to live",
  "nothing to live for",
  "don't want to live",
  "don't want to be alive",
  "don't want to wake up",
  "can't go on",
  "overdose",
] as const;

/** Lower-cases and folds typographic apostrophes and runs of whitespace. */
function normalize(text: string): string {
  return text.toLowerCase().replace(/[‘’ʼ]/g, "'").replace(/\s+/g, " ");
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Spaces and hyphens are interchangeable; apostrophes are optional. */
const toPattern = (phrase: string) =>
  escapeRegExp(phrase)
    .replace(/(?: |\\?-)/g, "[\\s-]+")
    .replace(/'/g, "'?");

const CRISIS_PATTERN = new RegExp(
  `(?<![\\p{L}\\p{N}])(?:${CRISIS_PHRASES.map(toPattern).join("|")})(?![\\p{L}\\p{N}])`,
  "u",
);

/** True when the text contains a crisis phrase (case-insensitive). */
export function isCrisisText(text: string): boolean {
  return CRISIS_PATTERN.test(normalize(text));
}

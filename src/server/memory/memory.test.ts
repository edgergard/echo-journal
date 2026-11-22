import { beforeEach, describe, expect, it } from "vitest";

import type { Entry } from "@/contracts/journal";
import { DEMO_USER_ID } from "@/contracts/session";
import { resetDemoStoreForTests } from "@/server/demo/store";

import {
  contentWords,
  MemoryMemoryStore,
  rankBySimilarity,
  stem,
  wordOverlap,
} from "./memory";
import { clipQuote, pickQuote, QUOTE_MAX, toRecalledRef } from "./recall";

const entry = (id: string, daysAgo: number, text: string): Entry => {
  const at = new Date(Date.UTC(2026, 10, 22) - daysAgo * 86_400_000);
  return {
    id,
    userId: "u1",
    text,
    mood: "okay",
    createdAt: at.toISOString(),
    updatedAt: at.toISOString(),
  };
};

describe("contentWords", () => {
  it("stems, folds synonyms and drops stop words", () => {
    expect(stem("letters")).toBe("letter");
    expect(stem("stopped")).toBe("stop");
    expect(stem("calling")).toBe("call");
    expect([...contentWords("Grandma’s letters and my grandmother's")]).toEqual(
      ["grandma", "letter"],
    );
    expect(contentWords("I couldn't do it today")).toEqual(new Set());
  });

  it("scores identical topics 1 and unrelated text 0", () => {
    expect(wordOverlap("letters from grandmother", "grandmother letters")).toBe(
      1,
    );
    expect(wordOverlap("rain on the window", "cooked rice for friends")).toBe(
      0,
    );
  });
});

describe("rankBySimilarity", () => {
  const today = entry(
    "today",
    0,
    "Called Dad about the move. We talked it through.",
  );
  const candidates = [
    entry("dad-move", 5, "Argued with Dad about the move."),
    entry("dad", 20, "Lunch with Dad."),
    entry("rain", 13, "Rain all day."),
    entry("newer", -1, "Dad helped with the move."),
    today,
  ];

  it("orders by similarity, only older entries, never the entry itself", () => {
    const ranked = rankBySimilarity(today, candidates, 3);
    expect(ranked.map((s) => s.entry.id)).toEqual(["dad-move", "dad"]);
    const [first, second] = ranked;
    expect(first && second && first.score > second.score).toBe(true);
  });

  it("respects k", () => {
    expect(rankBySimilarity(today, candidates, 1)).toHaveLength(1);
    expect(rankBySimilarity(today, candidates, 0)).toEqual([]);
  });

  it("breaks ties towards the more recent entry", () => {
    const ranked = rankBySimilarity(
      entry("x", 0, "Marta"),
      [entry("old", 9, "Marta"), entry("recent", 2, "Marta")],
      2,
    );
    expect(ranked.map((s) => s.entry.id)).toEqual(["recent", "old"]);
  });
});

describe("MemoryMemoryStore (demo persona)", () => {
  beforeEach(() => {
    resetDemoStoreForTests();
  });

  it("recalls the grandmother letters for a letters entry", async () => {
    const store = new MemoryMemoryStore();
    const now = new Date().toISOString();
    const similar = await store.similar(
      DEMO_USER_ID,
      {
        id: "new",
        userId: DEMO_USER_ID,
        text: "Read another of Grandma's letters tonight.",
        mood: "low",
        createdAt: now,
        updatedAt: now,
      },
      3,
    );
    expect(similar).toHaveLength(3);
    for (const s of similar) expect(s.entry.text).toMatch(/grand/i);
  });
});

describe("recalled quotes", () => {
  it("picks the sentence that echoes today's entry", () => {
    expect(
      pickQuote(
        "Long walk along the river. Called Marta, first time in weeks.",
        "Marta called back tonight.",
      ),
    ).toBe("Called Marta, first time in weeks.");
  });

  it("clips long quotes on a word boundary within the limit", () => {
    const quote = clipQuote("word ".repeat(60));
    expect(quote.length).toBeLessThanOrEqual(QUOTE_MAX);
    expect(quote.endsWith("word…")).toBe(true);
  });

  it("builds a RecalledRef with the past entry's id and date", () => {
    const past = entry("p", 3, "Argued with Dad. Need to call him.");
    expect(toRecalledRef(past, entry("t", 0, "Called Dad."))).toEqual({
      entryId: "p",
      date: past.createdAt,
      quote: "Argued with Dad.",
    });
  });
});

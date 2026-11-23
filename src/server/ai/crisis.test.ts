import { describe, expect, it } from "vitest";

import { CRISIS_PHRASES, isCrisisText } from "./crisis";

describe("isCrisisText", () => {
  it.each([
    "Some days I want to die.",
    "I keep thinking about SUICIDE lately",
    "Honestly they'd be better off without me",
    "I don’t want to live like this anymore", // typographic apostrophe
    "i dont want to live like this", // no apostrophe
    "I thought about how to End   My Life", // case and extra spaces
    "Started self harm again", // space instead of hyphen
    "I want to hurt myself",
  ])("matches %j", (text) => {
    expect(isCrisisText(text)).toBe(true);
  });

  it("matches every listed phrase on its own", () => {
    for (const phrase of CRISIS_PHRASES) {
      expect(isCrisisText(`Today: ${phrase}.`)).toBe(true);
    }
  });

  it.each([
    "Finally finished the move. The new flat is quiet.",
    "This deadline is killing me, but the project is fun.",
    "I could die laughing at Marta's camping photos.",
    "Read a book about the history of suicidology.", // a longer word
    "My knee hurt after the run, I need to rest it myself.",
    "",
  ])("does not match %j", (text) => {
    expect(isCrisisText(text)).toBe(false);
  });
});

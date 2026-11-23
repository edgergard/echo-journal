import { describe, expect, it } from "vitest";

import { routes, safeNextPath } from "./routes";

describe("safeNextPath", () => {
  it("keeps same-origin relative paths", () => {
    expect(safeNextPath("/week?week=2026-11-16")).toBe("/week?week=2026-11-16");
  });

  it("falls back to the journal for anything else", () => {
    expect(safeNextPath(null)).toBe(routes.journal);
    expect(safeNextPath("https://evil.example")).toBe(routes.journal);
    expect(safeNextPath("//evil.example")).toBe(routes.journal);
    expect(safeNextPath("")).toBe(routes.journal);
    expect(safeNextPath("journal")).toBe(routes.journal);
  });

  it("rejects backslash and control-character tricks", () => {
    for (const next of [
      "/\\evil.example",
      "/\\/evil.example",
      "/\t/evil.example",
      "/\n/evil.example",
      "/%5C%5Cevil.example".replace(/%5C/g, "\\"),
    ]) {
      expect(safeNextPath(next)).toBe(routes.journal);
    }
  });
});

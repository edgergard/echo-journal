import { describe, expect, it } from "vitest";

import { parseSignInParams } from "./sign-in-params";

describe("parseSignInParams", () => {
  it("keeps a same-origin next path and reads the callback error", () => {
    expect(
      parseSignInParams({ next: "/week?week=2026-11-16", error: "callback" }),
    ).toEqual({ next: "/week?week=2026-11-16", callbackFailed: true });
    expect(parseSignInParams({ next: ["/settings", "/week"] })).toEqual({
      next: "/settings",
      callbackFailed: false,
    });
  });

  it.each(["/\\evil.com", "//evil.com", "https://evil.com", "/\t/evil.com"])(
    "replaces next=%s with the journal",
    (next) => {
      expect(parseSignInParams({ next }).next).toBe("/journal");
    },
  );

  it("defaults to the journal", () => {
    expect(parseSignInParams({})).toEqual({
      next: "/journal",
      callbackFailed: false,
    });
  });
});

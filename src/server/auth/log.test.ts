import { afterEach, describe, expect, it, vi } from "vitest";

import { describeError, logAuthError } from "./log";

describe("describeError", () => {
  it("keeps name, message, status and code but redacts emails", () => {
    const error = Object.assign(
      new Error('Email address "sam@example.com" is invalid'),
      { name: "AuthApiError", status: 400, code: "email_address_invalid" },
    );
    const summary = describeError(error);
    expect(summary).toMatchObject({
      name: "AuthApiError",
      message: 'Email address "[email]" is invalid',
      status: 400,
      code: "email_address_invalid",
    });
    expect(JSON.stringify(summary)).not.toContain("sam@example.com");
  });

  it("drops PostgREST details that may hold row values", () => {
    const summary = describeError({
      message: "new row violates check constraint",
      code: "23514",
      details: "Failing row contains (private journal text)",
      hint: null,
    });
    expect(summary).toEqual({
      message: "new row violates check constraint",
      code: "23514",
    });
  });

  it("handles non-objects", () => {
    expect(describeError("boom")).toEqual({ message: "boom" });
    expect(describeError(undefined)).toEqual({ message: "undefined" });
  });
});

describe("logAuthError", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("logs with the [auth] prefix", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    logAuthError("resetDemo", new Error("x"));
    expect(spy).toHaveBeenCalledWith(
      "[auth] resetDemo failed",
      expect.objectContaining({ message: "x" }),
    );
  });
});

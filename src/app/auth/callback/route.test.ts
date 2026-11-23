// @vitest-environment node
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AuthResult } from "@/contracts/backend";

import { GET } from "./route";

const exchangeCode = vi.hoisted(() =>
  vi.fn<(code: string) => Promise<AuthResult>>(),
);

vi.mock("@/server/backend", () => ({
  getBackend: () => ({ auth: { exchangeCode } }),
}));

const ORIGIN = "http://localhost:3000";
const UNSAFE_NEXT = ["/\\evil.com", "//evil.com", "https://evil.com"];

function callback(params: Record<string, string>) {
  const url = new URL("/auth/callback", ORIGIN);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return GET(new NextRequest(url));
}

describe("GET /auth/callback", () => {
  beforeEach(() => {
    exchangeCode.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("exchanges the code and opens a same-origin next path", async () => {
    exchangeCode.mockResolvedValue({ ok: true });
    const response = await callback({
      code: "abc",
      next: "/week?week=2026-11-16",
    });
    expect(exchangeCode).toHaveBeenCalledWith("abc");
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      `${ORIGIN}/week?week=2026-11-16`,
    );
  });

  it.each(UNSAFE_NEXT)("sends next=%s to the journal", async (next) => {
    exchangeCode.mockResolvedValue({ ok: true });
    const response = await callback({ code: "abc", next });
    expect(response.headers.get("location")).toBe(`${ORIGIN}/journal`);
  });

  it.each(UNSAFE_NEXT)(
    "keeps next=%s off the sign-in redirect after a failure",
    async (next) => {
      exchangeCode.mockResolvedValue({ ok: false, reason: "failed" });
      const response = await callback({ code: "abc", next });
      expect(response.headers.get("location")).toBe(
        `${ORIGIN}/sign-in?next=%2Fjournal&error=callback`,
      );
    },
  );

  it("logs a thrown exchange error without the code and returns to sign-in", async () => {
    exchangeCode.mockRejectedValue(new Error("network down"));
    const response = await callback({ code: "secret-code", next: "/week" });
    expect(response.headers.get("location")).toBe(
      `${ORIGIN}/sign-in?next=%2Fweek&error=callback`,
    );
    expect(console.error).toHaveBeenCalledWith(
      "[auth] exchangeCode failed",
      expect.objectContaining({ message: "network down" }),
    );
    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain(
      "secret-code",
    );
  });

  it("returns to sign-in when the link carries no code", async () => {
    const response = await callback({
      error: "access_denied",
      error_code: "otp_expired",
      error_description: "Email link is invalid or has expired",
    });
    expect(exchangeCode).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toBe(
      `${ORIGIN}/sign-in?next=%2Fjournal&error=callback`,
    );
    expect(console.error).toHaveBeenCalledWith(
      "[auth] callback failed",
      expect.objectContaining({ code: "otp_expired" }),
    );
  });
});

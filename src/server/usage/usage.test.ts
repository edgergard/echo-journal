import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { resetDemoStoreForTests } from "@/server/demo/store";

import { MemoryUsageLimiter, utcDay } from "./memory";
import { dailyLimitMessage } from "./messages";

describe("MemoryUsageLimiter", () => {
  beforeEach(() => {
    resetDemoStoreForTests();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-22T10:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows `limit` calls per user, then refuses", async () => {
    const usage = new MemoryUsageLimiter(3);
    expect(usage.limit()).toBe(3);
    expect(await usage.consume("u1")).toEqual({ allowed: true, remaining: 2 });
    expect(await usage.consume("u1")).toEqual({ allowed: true, remaining: 1 });
    expect(await usage.consume("u1")).toEqual({ allowed: true, remaining: 0 });
    expect(await usage.consume("u1")).toEqual({ allowed: false, remaining: 0 });
    expect(await usage.remaining("u1")).toBe(0);
  });

  it("counts each user separately", async () => {
    const usage = new MemoryUsageLimiter(1);
    await usage.consume("u1");
    expect(await usage.remaining("u1")).toBe(0);
    expect(await usage.remaining("u2")).toBe(1);
    expect((await usage.consume("u2")).allowed).toBe(true);
  });

  it("resets at midnight UTC, not local midnight", async () => {
    const usage = new MemoryUsageLimiter(1);
    vi.setSystemTime(new Date("2026-11-22T23:59:59Z"));
    expect((await usage.consume("u1")).allowed).toBe(true);
    expect((await usage.consume("u1")).allowed).toBe(false);
    vi.setSystemTime(new Date("2026-11-23T00:00:01Z"));
    expect(await usage.remaining("u1")).toBe(1);
    expect((await usage.consume("u1")).allowed).toBe(true);
  });

  it("names the UTC day", () => {
    expect(utcDay(new Date("2026-11-22T23:30:00-05:00"))).toBe("2026-11-23");
  });
});

describe("dailyLimitMessage", () => {
  it("uses the design copy", () => {
    expect(dailyLimitMessage(10)).toBe(
      "You've used today's 10 replies. Echo will be back tomorrow.",
    );
    expect(dailyLimitMessage(1)).toBe(
      "You've used today's 1 reply. Echo will be back tomorrow.",
    );
  });
});

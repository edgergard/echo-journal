import "server-only";

import type { UsageLimiter } from "@/contracts/backend";
import { getDemoStore } from "@/server/demo/store";

export function utcDay(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

/** Demo-mode daily AI limit on the in-memory store. */
export class MemoryUsageLimiter implements UsageLimiter {
  constructor(private readonly dailyLimit: number) {}

  limit(): number {
    return this.dailyLimit;
  }

  async remaining(userId: string): Promise<number> {
    const used = getDemoStore().usage.get(`${userId}:${utcDay()}`) ?? 0;
    return Math.max(this.dailyLimit - used, 0);
  }

  async consume(userId: string) {
    const key = `${userId}:${utcDay()}`;
    const usage = getDemoStore().usage;
    const used = usage.get(key) ?? 0;
    if (used >= this.dailyLimit) return { allowed: false, remaining: 0 };
    usage.set(key, used + 1);
    return { allowed: true, remaining: this.dailyLimit - used - 1 };
  }
}

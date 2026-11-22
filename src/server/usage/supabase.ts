import "server-only";

import type { UsageLimiter } from "@/contracts/backend";

const TODO = "Supabase usage limiter is not implemented yet (stream 1-ai)";

/** Real-mode daily AI limit on Supabase. Stub — implemented by stream 1-ai. */
export class SupabaseUsageLimiter implements UsageLimiter {
  constructor(private readonly dailyLimit: number) {}
  limit(): number {
    return this.dailyLimit;
  }
  async remaining(): Promise<number> {
    throw new Error(TODO);
  }
  async consume(): Promise<{ allowed: boolean; remaining: number }> {
    throw new Error(TODO);
  }
}

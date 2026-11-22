import "server-only";

import * as z from "zod";

import type { UsageLimiter } from "@/contracts/backend";
import { createSupabaseServerClient } from "@/server/auth/supabase-client";

import { utcDay } from "./memory";

/**
 * Real-mode daily AI limit in `ai_usage`, one row per user per UTC day.
 * `consume_ai_usage()` increments atomically and returns null over the limit.
 * Replies and week summaries share it.
 */
export class SupabaseUsageLimiter implements UsageLimiter {
  constructor(private readonly dailyLimit: number) {}

  limit(): number {
    return this.dailyLimit;
  }

  async remaining(userId: string): Promise<number> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("ai_usage")
      .select("used")
      .eq("user_id", userId)
      .eq("day", utcDay())
      .maybeSingle();
    if (error) throw new Error(`Couldn't read AI usage: ${error.message}`);
    const used = data ? z.object({ used: z.number() }).parse(data).used : 0;
    return Math.max(this.dailyLimit - used, 0);
  }

  async consume(): Promise<{ allowed: boolean; remaining: number }> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc("consume_ai_usage", {
      daily_limit: this.dailyLimit,
    });
    if (error) throw new Error(`Couldn't record AI usage: ${error.message}`);
    const used = z.number().int().nullable().parse(data);
    if (used === null) return { allowed: false, remaining: 0 };
    return { allowed: true, remaining: Math.max(this.dailyLimit - used, 0) };
  }
}

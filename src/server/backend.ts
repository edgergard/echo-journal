import "server-only";

import type { Backend } from "@/contracts/backend";
import { env } from "@/env";
import { FakeAiClient } from "@/server/ai/fake";
import { OpenRouterAiClient } from "@/server/ai/openrouter";
import { MemoryAuthService } from "@/server/auth/memory";
import { SupabaseAuthService } from "@/server/auth/supabase";
import { MemoryEntriesRepo } from "@/server/entries/memory";
import { SupabaseEntriesRepo } from "@/server/entries/supabase";
import { MemoryMemoryStore } from "@/server/memory/memory";
import { SupabaseMemoryStore } from "@/server/memory/supabase";
import { MemoryReflectionsRepo } from "@/server/reflections/memory";
import { SupabaseReflectionsRepo } from "@/server/reflections/supabase";
import { MemoryUsageLimiter } from "@/server/usage/memory";
import { SupabaseUsageLimiter } from "@/server/usage/supabase";

/** Supabase mode needs the public URL and anon key; otherwise demo mode. */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function isOpenRouterConfigured(): boolean {
  return Boolean(env.OPENROUTER_API_KEY);
}

function createBackend(): Backend {
  const supabase = isSupabaseConfigured();
  const openRouter = isOpenRouterConfigured();
  const limit = env.AI_DAILY_LIMIT;
  return {
    mode: {
      data: supabase ? "supabase" : "demo",
      ai: openRouter ? "openrouter" : "fake",
    },
    auth: supabase ? new SupabaseAuthService() : new MemoryAuthService(),
    entries: supabase ? new SupabaseEntriesRepo() : new MemoryEntriesRepo(),
    reflections: supabase
      ? new SupabaseReflectionsRepo()
      : new MemoryReflectionsRepo(),
    memory: supabase ? new SupabaseMemoryStore() : new MemoryMemoryStore(),
    ai: openRouter ? new OpenRouterAiClient() : new FakeAiClient(),
    usage: supabase
      ? new SupabaseUsageLimiter(limit)
      : new MemoryUsageLimiter(limit),
  };
}

let backend: Backend | undefined;

/** The app's backend, chosen once per process from env. */
export function getBackend(): Backend {
  backend ??= createBackend();
  return backend;
}

# Echo Journal — build plan

Status: wave-1 running
Orchestrator launch mode: CLI
Merge method: GitHub PR into dev
Repo: C:\Projects\echo-journal Remote: https://github.com/edgergard/echo-journal Visibility: public

## Goal

A web journal whose AI companion ("Echo") replies to each entry with memory of past entries (RAG over the user's own entries) and sums up the week's mood and themes. Portfolio project: public repo + live demo with a one-click demo account.

## Scope

- In: the 7 Must features of docs/product/idea.md — accounts + demo, entries CRUD with mood, streaming AI reply (AI SDK + OpenRouter, Node runtime route handler), memory (embeddings + vector search, "Recalled" margin notes), weekly summary, guards (disclaimer, crisis card, daily AI limit), quality (Vitest + RTL, Playwright e2e in CI, accessibility, README "Built with Claude Code").
- Out (non-goals): voice entries, export, reminders, Ukrainian UI, Storybook (Later); payments, native app, therapy claims (Never).

## Assumptions

- **Demo mode (L-029):** with no Supabase env the app runs on an in-memory backend seeded with the demo persona (20 entries), and with no OpenRouter key on a fake AI that streams canned replies — so streams, CI and the smoke run need no keys. Real services switch on when their env vars are set.
- App screens live in a route group `src/app/(app)/` (URLs unchanged: `/journal`, `/week`, `/settings`) so one layout renders the AppHeader; design.md's Routes table lists the paths without the group.
- Demo account in real mode: a fixed Supabase user (`DEMO_USER_EMAIL` / `DEMO_USER_PASSWORD`, server-only); "Try the demo" signs in server-side. Demo data reset: "Reset demo data" in settings (daily cron is Later).
- Daily AI limit: 10 calls per user per UTC day (`AI_DAILY_LIMIT`), replies and week summaries share it.
- Crisis detection: a keyword/phrase list (English) checked before any AI call; match → crisis card, no model call.
- Embeddings: `openai/text-embedding-3-small` via OpenRouter, `vector(1536)`; chat: a cheap model via `OPENROUTER_CHAT_MODEL` (default `openai/gpt-4.1-mini`, _assumption_).
- Accessibility target "Lighthouse a11y ≥ 90" is checked with axe in Playwright e2e plus one Lighthouse run in Phase 5.

## Stack

template-nextjs-pet (Next.js 16.4 App Router + Cache Components, React 19.3, TypeScript 5.9, Tailwind 4.3, shadcn/ui base-nova, zod 4.6, Vitest 5.1, Playwright). Added: `ai`, `@ai-sdk/react`, `@openrouter/ai-sdk-provider`, `@supabase/supabase-js`, `@supabase/ssr`, `react-hook-form`, `@hookform/resolvers`, `@axe-core/playwright` (dev); shadcn: textarea, label, input, toggle-group, alert, chart, alert-dialog, skeleton, dropdown-menu. Fonts: Geist (template) + Literata (`next/font/google`). Versions verified at foundation with `npm view` / Context7.

## Services & env

| Service                                            | Env vars (names only)                                                                         | Public / secret                         | Where the value lives                               | Who sets it up                      |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------- | --------------------------------------------------- | ----------------------------------- |
| Supabase (dev project, Postgres + pgvector + auth) | NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY                                       | public                                  | .env.local (dev) · vercel env (prod)                | user                                |
| Supabase (server)                                  | SUPABASE_SERVICE_ROLE_KEY                                                                     | secret                                  | .env.local · vercel env                             | user                                |
| Supabase auth — GitHub OAuth + magic link          | (configured in the Supabase dashboard: GitHub OAuth app, redirect URL `<site>/auth/callback`) | —                                       | Supabase dashboard                                  | user                                |
| Demo account                                       | DEMO_USER_EMAIL, DEMO_USER_PASSWORD                                                           | secret                                  | .env.local · vercel env                             | user (creates the user in Supabase) |
| OpenRouter (chat + embeddings)                     | OPENROUTER_API_KEY                                                                            | secret                                  | .env.local · vercel env; spend limit set on the key | user                                |
| OpenRouter models                                  | OPENROUTER_CHAT_MODEL, OPENROUTER_EMBEDDING_MODEL                                             | public (non-secret config, server-side) | defaults in src/env.ts                              | —                                   |
| Limits                                             | AI_DAILY_LIMIT                                                                                | non-secret                              | default 10 in src/env.ts                            | —                                   |
| Vercel (hosting)                                   | —                                                                                             | —                                       | Vercel project linked to the repo                   | user                                |

CI needs none of these (demo mode).

## Contracts (created in foundation, owned by orchestrator)

| Contract                   | Path                                                                                                                                                                              | Notes                                                                                               |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Domain types + zod schemas | src/contracts/journal.ts, src/contracts/session.ts                                                                                                                                | Mood, Entry, EntryInput, Reflection, RecalledRef, WeekSummary, Session                              |
| Backend interfaces         | src/contracts/backend.ts                                                                                                                                                          | AuthService, EntriesRepo, ReflectionsRepo, MemoryStore, AiClient, UsageLimiter                      |
| Backend wiring             | src/server/backend.ts                                                                                                                                                             | `getBackend()` picks in-memory / fake vs Supabase / OpenRouter by env                               |
| Demo seed + store          | src/server/demo/seed.ts, src/server/demo/store.ts                                                                                                                                 | demo persona: 20 entries, reflections with recalled refs; shared in-memory store                    |
| API schemas                | src/contracts/api.ts                                                                                                                                                              | request schemas + reply header names                                                                |
| API surface                | src/app/api/reflect/route.ts (POST `{ entryId, regenerate? }` → text stream + `x-echo-status` header), src/app/api/week/route.ts (GET `?weekStart=YYYY-MM-DD` → WeekSummary JSON) | stubs; signatures fixed                                                                             |
| DB schema                  | supabase/migrations/0001_init.sql                                                                                                                                                 | entries, reflections, entry_embeddings (vector 1536) + match_entries(), ai_usage; RLS by auth.uid() |
| Route map                  | src/lib/routes.ts                                                                                                                                                                 | path helpers used by every stream                                                                   |
| Design tokens              | src/app/globals.css, src/app/layout.tsx                                                                                                                                           | design.md palette, system theme, Literata                                                           |
| Env schema                 | src/env.ts                                                                                                                                                                        | all optional; check passes without .env                                                             |
| Shared UI                  | src/components/ui/** (shadcn), src/components/app-header.tsx, src/app/(app)/layout.tsx                                                                                            |                                                                                                     |

## Dependency graph

- foundation → all wave-1 streams
- 1-auth, 1-entries, 1-ai, 1-week → independent of each other (build against contracts + in-memory backend + stubs)
- 2-quality (e2e, a11y, README) → all of wave 1

## Waves

### Wave 1

| Stream    | Branch           | Owns (only these paths)                                                                                                                                                                                         | Port | Provider/profile · mode         | Agent ID | Workspace ID         | Status  | PR  |
| --------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- | ------------------------------- | -------- | -------------------- | ------- | --- |
| 1-auth    | stream/1-auth    | src/app/page.tsx(+test), src/app/sign-in/**, src/app/auth/**, src/app/(app)/settings/**, src/proxy.ts(+test), src/server/auth/**, src/components/auth/**, src/components/settings/**, src/components/landing/** | 3101 | claude/claude-opus-5-5 · auto   | e429c983 | wks_ad278f649ad8dcef | running |     |
| 1-entries | stream/1-entries | src/app/(app)/journal/** , src/server/entries/**, src/components/entries/**                                                                                                                                     | 3102 | claude/claude-sonnet-5-5 · auto | d190bb17 | wks_43af7e54ab8d649e | running |     |
| 1-ai      | stream/1-ai      | src/app/api/reflect/**, src/server/ai/**, src/server/memory/**, src/server/reflections/**, src/server/usage/**, src/components/reflection/**                                                                    | 3103 | claude/claude-opus-5-5 · auto   | ff4516e1 | wks_9bafda538d0201f9 | running |     |
| 1-week    | stream/1-week    | src/app/(app)/week/**, src/app/api/week/**, src/server/week/**, src/components/week/**                                                                                                                          | 3104 | claude/claude-sonnet-5-5 · auto | 025fd37b | wks_38e979a77109001b | fixing  |     |

### Wave 2

| Stream    | Branch           | Owns (only these paths)           | Port | Provider/profile · mode         | Agent ID | Workspace ID | Status  | PR  |
| --------- | ---------------- | --------------------------------- | ---- | ------------------------------- | -------- | ------------ | ------- | --- |
| 2-quality | stream/2-quality | e2e/**, README.md, docs/assets/** | 3105 | claude/claude-sonnet-5-5 · auto |          |              | pending |     |

Status values: pending · running · permission · escalation · done (report in) · in review · fixing · merged · failed

## Metrics

Gate A approved: 2026-11-22 · Gate A rounds: 1
Retries: 0 · Failed streams: 0 · Escalations: 0 · Red dev fixes: 0 · Review findings fixed: 0 · User corrections: 0

## Log

- 2026-11-22 plan drafted; Gate A approved (round 1)
- 2026-11-22 repo created from template-nextjs-pet (b6f837a); foundation: tokens, Literata, deps, shadcn, contracts, demo backend + seed, stubs, migration, Playwright + CI e2e job
- 2026-11-22 wave 1 launched from dev 4cba4b6 (4 streams, CLI mode, mode auto confirmed)
- 2026-11-22 1-week reported done (PR #3); review: 2 findings (limit burn on every view, no loading on week change) sent back

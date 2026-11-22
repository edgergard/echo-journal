# Stream 1-ai: Echo's streaming reply, memory (RAG), guards

First read and follow `docs/plan/streams/_common.md` (setup, rules, report). Branch: `stream/1-ai`. Dev-server port: **3103**.

## Task

Build the reply pipeline: when an entry is saved (or the user regenerates), Echo replies in a stream, grounded in the user's most similar past entries, shown as "Recalled" margin notes. Guards: crisis phrases → crisis card instead of a model call; daily AI limit; errors never lose the entry. Also the real week-summary model call (`AiClient.summarizeWeek`) used by stream 1-week.

## Context

- Design: screen `entry` — the ReflectionPanel, RecalledNote and CrisisCard parts and their states (streaming, done, no-memory, crisis, limit, error); flows `loop` steps 3–4 and `guards` in `docs/product/design.md`. Visual reference: `docs/product/prototype/entry.dc.html` (reply card + margin aside with recalled notes and the short primary connector stub). design.md wins (sentence-case "Echo" label).
- Contracts: `Reflection`, `RecalledRef` in `src/contracts/journal.ts`; `AiClient`, `MemoryStore`, `ReflectionsRepo`, `UsageLimiter` in `src/contracts/backend.ts`; `getBackend()`; `requireSession()`.
- API (signature fixed in the stub `src/app/api/reflect/route.ts`): `POST { entryId: string, regenerate?: boolean }` (body schema and header names in `src/contracts/api.ts`; Node.js runtime is the default — do not add a `runtime` export). Order: session → load entry → crisis check (no model call, no usage) → usage.consume (limit → status `limit`) → memory.index(entry) → memory.similar(k=3, excluding the entry, only older entries) → stream reply with AI SDK `streamText` → on finish save the Reflection with its recalled refs. Response: text stream; header `x-echo-status: streaming | crisis | limit` and `x-echo-recalled` (JSON of RecalledRef[], URI-encoded) so the client can render notes after the stream. An existing reply and no `regenerate` → return it without a model call.
- Real mode: `@openrouter/ai-sdk-provider` — `createOpenRouter({ apiKey: env.OPENROUTER_API_KEY })`, chat model `env.OPENROUTER_CHAT_MODEL`, embeddings `openrouter.textEmbeddingModel(env.OPENROUTER_EMBEDDING_MODEL)` with `embed()` (1536 dims); Supabase: `entry_embeddings` + `match_entries()` RPC, `reflections`, `ai_usage` from `supabase/migrations/0001_init.sql`, via `createSupabaseServerClient()` from `src/server/auth/supabase-client.ts`.
- Demo mode: the fake AI (`src/server/ai/fake.ts`, working) streams a canned reply that mentions the recalled entries; the in-memory MemoryStore (`src/server/memory/memory.ts`, working baseline: word-overlap similarity) — improve it if needed so the demo persona recalls sensibly.
- Prompt: warm, brief (≤ 120 words), English or the entry's language, never diagnoses, reflects one pattern, asks one gentle question, references recalled entries by date. Keep the prompt in `src/server/ai/prompts.ts` with a unit test of its assembly.
- Client: `src/components/reflection/reflection-panel.tsx` (stub with the fixed props `{ entryId, initialReflection, justSaved?, edited? }`; it is rendered by stream 1-entries) — a client component that shows an existing reply, or POSTs to `/api/reflect` and renders the stream (AI SDK UI hook or `fetch` + reader — look up the current API), then RecalledNotes in a margin `<aside aria-label="Recalled entries">` at ≥ lg and below the reply on small screens, each linking to `/journal/<id>`; "Regenerate reply" when `edited` or after an error; announce "Echo is replying…" / "Reply ready" via role=status (not per token); `prefers-reduced-motion` respected. CrisisCard uses shadcn `alert`.
- Stubs prepared for you: `src/app/api/reflect/route.ts`, `src/components/reflection/reflection-panel.tsx`, `src/server/ai/{fake,openrouter}.ts`, `src/server/memory/{memory,supabase}.ts`, `src/server/reflections/{memory,supabase}.ts`, `src/server/usage/{memory,supabase}.ts`.

## You own (edit ONLY these paths)

- src/app/api/reflect/**
- src/server/ai/**, src/server/memory/**, src/server/reflections/**, src/server/usage/**
- src/components/reflection/** (ReflectionPanel, RecalledNote, CrisisCard, tests)

## Acceptance criteria

- [ ] Saving an entry in demo mode streams a reply on the entry page, then shows 1–3 recalled notes linking to older entries; first entries without history show "Echo starts recalling after a few entries."
- [ ] Crisis phrase list (`src/server/ai/crisis.ts`) with unit tests (positive and negative cases, case-insensitive); a match returns the crisis card, makes no model call and uses no quota; the entry stays saved.
- [ ] Daily limit enforced per user per UTC day (`env.AI_DAILY_LIMIT`), shared with week summaries; limit state copy from design.md; unit-tested.
- [ ] Error state "Echo couldn't reply right now. Your entry is saved." + "Try again".
- [ ] Real implementations: OpenRouter chat + embeddings + summarizeWeek; Supabase memory (upsert embedding, `match_entries`), reflections, usage.
- [ ] Tests: crisis, usage limiter, prompt assembly, memory similarity ordering, route handler happy path / crisis / limit with the memory backend and fake AI, ReflectionPanel states.
- [ ] `npm run check` passes.

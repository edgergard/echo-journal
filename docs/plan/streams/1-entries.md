# Stream 1-entries: journal list, new entry, entry page (view, edit, delete)

First read and follow `docs/plan/streams/_common.md` (setup, rules, report). Branch: `stream/1-entries`. Dev-server port: **3102**.

## Task

Let a signed-in user see their journal, write a new entry with a mood, open an entry, edit it and delete it. The entry page also hosts Echo's reply, which another stream builds — you only place the `ReflectionPanel` component.

## Context

- Design: screens `journal`, `new-entry`, `entry` (everything except the reply content: header, text, mood, edit mode, delete dialog, states); flow `loop` steps 1–3 and `signup` step 3 in `docs/product/design.md`. Visual references: `docs/product/prototype/journal.dc.html`, `docs/product/prototype/journal-dark.dc.html`, `docs/product/prototype/entry.dc.html` (layout: entry column + margin column for recalled notes — the margin column belongs to `ReflectionPanel`). Note: the prototype shows the section labels "Echo"/"Mood" in tracked uppercase — design.md wins, use sentence case.
- Contracts: `Entry`, `EntryInput`, `Mood` (zod) in `src/contracts/journal.ts`; `EntriesRepo` in `src/contracts/backend.ts`; `getBackend().entries`; `requireSession()` from `src/server/auth/require-session.ts`; `src/lib/routes.ts`.
- Reply integration: on the entry page render `<ReflectionPanel entryId={entry.id} initialReflection={reflection} justSaved={...} />` from `src/components/reflection/reflection-panel.tsx` (stub now, built by stream 1-ai; do not edit it). Get `reflection` with `getBackend().reflections.get(userId, entryId)`. After creating an entry, redirect to `/journal/<id>?saved=1` and pass `justSaved` so the page announces "Entry saved" (role=status). After editing, pass `edited` so the panel can offer "Regenerate reply".
- Stubs prepared for you: `src/app/(app)/journal/page.tsx`, `src/app/(app)/journal/new/page.tsx`, `src/app/(app)/journal/[id]/page.tsx`, `src/server/entries/memory.ts` (working), `src/server/entries/supabase.ts` (stub).
- Real mode: implement `src/server/entries/supabase.ts` against `supabase/migrations/0001_init.sql` (table `entries`, RLS by user) using the server Supabase client helper exported by `src/server/auth/supabase-client.ts` (foundation stub: `createSupabaseServerClient()`).

## You own (edit ONLY these paths)

- src/app/(app)/journal/** (pages, `loading.tsx`, `error.tsx`, `not-found.tsx`, server actions, tests beside them)
- src/server/entries/**
- src/components/entries/** (EntryCard, EntryEditor, MoodPicker, DeleteEntryDialog, tests)

## Acceptance criteria

- [ ] Journal: list (`<ol>`) of EntryCards newest first, "Echo replied" mark, "Show older entries" pagination (20 per page), empty / loading / error states with design.md copy.
- [ ] New entry: date heading, borderless Literata textarea (label "Entry text"), MoodPicker as a radio group with 5 labelled moods, zod validation (1–5000 chars, mood required), "Saving…" state, error keeps the text, Cancel with unsaved-text confirmation; save → `/journal/<id>?saved=1`.
- [ ] Entry: back link, date + mood, "Entry actions" menu (Edit / Delete), entry text (Literata 18px, ≤ 68ch), `ReflectionPanel` placed below with room for its margin column at ≥ lg; edit in place → "Save changes" / "Cancel"; delete via alert-dialog → `/journal` + "Entry deleted" status; not-found state.
- [ ] Supabase implementation of `EntriesRepo` (create/list/get/update/remove, pagination).
- [ ] Tests: EntryEditor validation, MoodPicker accessibility (radio semantics), memory repo pagination, server action happy path with the memory backend.
- [ ] `npm run check` passes.
- [ ] UI: tokens only, visible focus, works at 360px and desktop; dark theme via system preference.

# Stream 1-week: weekly summary page

First read and follow `docs/plan/streams/_common.md` (setup, rules, report). Branch: `stream/1-week`. Dev-server port: **3104**.

## Task

Build "This week": a mood line chart for the 7 days (Mon–Sun) and an AI summary of 3–5 themes with links to the entries behind them, with previous/next week navigation.

## Context

- Design: screen `week`; flow `demo` step 5 in `docs/product/design.md` — every state (content, empty < 2 entries, loading, error, limit), copy verbatim, accessibility notes (chart `role="img"` + aria-label, "Show as table" alternative, mood never by colour only). Visual reference: `docs/product/prototype/week.dc.html` (design.md wins: sentence-case labels).
- Contracts: `WeekSummary`, `Mood`, `Entry` in `src/contracts/journal.ts`; `AiClient.summarizeWeek`, `EntriesRepo`, `UsageLimiter` in `src/contracts/backend.ts`; `getBackend()`; `requireSession()`; `src/lib/routes.ts`.
- API (signature fixed in the stub `src/app/api/week/route.ts`): `GET ?weekStart=YYYY-MM-DD` (a Monday, UTC) → `WeekSummary` JSON. Compose in `src/server/week/`: load the week's entries via `getBackend().entries` (add nothing to the contract — filter what `list` returns, paging back until older than the week), build the 7-day mood series (a day with several entries → the latest mood), call `getBackend().ai.summarizeWeek(entries)` for themes when there are ≥ 2 entries (consumes one usage unit; limit → limit state), cache nothing per user. The model call itself (OpenRouter) is built by stream 1-ai; the fake AI already returns themes in demo mode.
- Chart: shadcn `chart` (Recharts) line chart with `--chart-1`, y-axis labelled with the 5 moods, gaps for days without entries; "Show as table" toggles an accessible table.
- Week navigation via `?week=YYYY-MM-DD` on `/week`; "Next week" disabled for the current week. "Refresh summary" re-requests the summary.
- Stubs prepared for you: `src/app/(app)/week/page.tsx`, `src/app/api/week/route.ts`.

## You own (edit ONLY these paths)

- src/app/(app)/week/** (page, loading, error, tests)
- src/app/api/week/**
- src/server/week/**
- src/components/week/** (MoodChart, ThemeList, WeekNav, tests)

## Acceptance criteria

- [ ] In demo mode `/week` shows the current week of the demo persona with the chart and themes linking to entries; previous weeks navigable.
- [ ] Empty (< 2 entries), loading ("Echo is reading your week…"), error + "Try again", limit states per design.md.
- [ ] Pure functions for week bounds (UTC Monday start), mood series, entry filtering — unit-tested, including week boundaries.
- [ ] Chart has `role="img"` with a full aria-label; table view works with keyboard.
- [ ] `npm run check` passes.
- [ ] UI: tokens only, visible focus, works at 360px and desktop; dark theme via system preference.

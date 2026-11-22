# Stream 2-quality: end-to-end tests, accessibility checks, README

First read and follow `docs/plan/streams/_common.md` (setup, rules, report). Branch: `stream/2-quality`. Dev-server port: **3105**.

## Task

Prove the main flows work and present the project: Playwright e2e specs that run in CI in demo mode, axe accessibility checks on every screen, and a README for recruiters.

## Context

- The app is fully built on `dev` (waves 1). Flows in `docs/product/design.md`: `demo`, `loop`, `guards`, `signup` (demo-mode variant). Must #7 in `docs/product/idea.md`.
- Foundation prepared: `playwright.config.ts` (webServer = `npm run build && npx next start --port 3105`, testDir `e2e/`), `@axe-core/playwright`, and the CI `e2e` job in `.github/workflows/ci.yml` — do not edit them; escalate if they need changes.
- Demo mode keeps its session in memory: move through flows by in-app clicks, not URL navigation after sign-in (a reload may sign out) (L-029).

## You own (edit ONLY these paths)

- e2e/** (specs, fixtures, helpers)
- README.md
- docs/assets/** (screenshots / GIF for the README)

## Acceptance criteria

- [ ] e2e specs: demo flow (landing → Try the demo → journal → entry with recalled notes → week); loop (new entry → saved → streamed reply from the fake AI → recalled note link); guards (crisis phrase → crisis card; validation errors on empty entry); auth gate (`/journal` without session → `/sign-in`); delete entry.
- [ ] axe check with no serious/critical violations on landing, sign-in, journal, new entry, entry, week, settings — light and dark (`colorScheme`).
- [ ] `npx playwright test` passes locally and the CI `e2e` job is green on the PR.
- [ ] README: what Echo is (one paragraph), live demo link placeholder `<!-- LIVE_URL -->`, screenshots (journal, entry with recalled notes, week) captured from the running app into `docs/assets/`, features, "How the memory works" with a small diagram (Mermaid: save → embed → pgvector match → prompt → stream → recalled notes), stack, "Run locally" (demo mode needs no keys; real mode env list from PLAN.md Services & env — names only), tests, "Built with Claude Code" (the product chain: idea → design → prototype → parallel agent build; link `docs/product/`), disclaimer "Echo is not a therapist."
- [ ] `npm run check` passes.

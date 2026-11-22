# Stream 2-quality: end-to-end tests, accessibility checks, README

First read and follow `docs/plan/streams/_common.md` (setup, rules, report). Branch: `stream/2-quality`. Dev-server port: **3105**.

## Task

Prove the main flows work and present the project: Playwright e2e specs that run in CI in demo mode, axe accessibility checks on every screen, and a README for recruiters.

## Context

- The app is fully built on `dev` (waves 1). Flows in `docs/product/design.md`: `demo`, `loop`, `guards`, `signup` (demo-mode variant). Must #7 in `docs/product/idea.md`.
- Foundation prepared: `playwright.config.ts` (webServer = `npm run build && npx next start --port 3105`, testDir `e2e/`), `@axe-core/playwright`, and the CI `e2e` job in `.github/workflows/ci.yml` — do not edit them; escalate if they need changes.
- Demo mode keeps its data in server memory and the session in an httpOnly cookie (`echo_demo_session`): data persists while `next start` runs, so tests that add or delete entries must not depend on each other's leftovers — prefer in-app clicks, and use Settings → "Reset demo data" (demo only) to restore the seed where a test needs a clean state (L-029).
- What was built (read the code for selectors — prefer roles and visible text over test ids):
  - Landing `/` → "Try the demo" → `/journal`. The newest seeded entry (`/journal/demo-e01`) already has a reply with 2 recalled notes in `<aside aria-label="Recalled entries">`.
  - New entry `/journal/new` → save → `/journal/<id>?saved=1` (status "Entry saved", param then removed) → `ReflectionPanel` streams the fake reply (status "Echo is replying…" → "Reply ready"), then recalled notes.
  - Crisis: any phrase from `src/server/ai/crisis.ts` (e.g. "I want to die") shows the crisis card, no reply.
  - Other reply states (limit, busy, error) are covered by unit tests; don't force them in e2e.
  - Week `/week`: chart (`role="img"`), "Show as table", themes from the fake AI; Previous/Next week.
  - Settings: "Replies left today: n of 10", "Reset demo data", "Sign out".
- Accessibility fixes: you may make **minimal** fixes in `src/app/**` and `src/components/**` (not `src/components/ui/**`, contracts or shared layout) when axe reports a serious/critical violation — list each file and the violation in the report. Anything bigger or in shared files → escalate.

## You own (edit ONLY these paths)

- e2e/** (specs, fixtures, helpers)
- README.md
- docs/assets/** (screenshots / GIF for the README)
- minimal axe fixes in src/app/** and src/components/** (see Context; not src/components/ui/**)

## Acceptance criteria

- [ ] e2e specs: demo flow (landing → Try the demo → journal → entry with recalled notes → week); loop (new entry → saved → streamed reply from the fake AI → recalled note link); guards (crisis phrase → crisis card; validation errors on empty entry); auth gate (`/journal` without session → `/sign-in`); delete entry.
- [ ] axe check with no serious/critical violations on landing, sign-in, journal, new entry, entry, week, settings — light and dark (`colorScheme`).
- [ ] `npx playwright test` passes locally and the CI `e2e` job is green on the PR.
- [ ] README: what Echo is (one paragraph), live demo link placeholder `<!-- LIVE_URL -->`, screenshots (journal, entry with recalled notes, week) captured from the running app into `docs/assets/`, features, "How the memory works" with a small diagram (Mermaid: save → embed → pgvector match → prompt → stream → recalled notes), stack, "Run locally" (demo mode needs no keys; real mode env list from PLAN.md Services & env — names only; note the production chat model is an OpenRouter `:free` model and replies are capped to keep costs near zero), tests, "Built with Claude Code" (the product chain: idea → design → prototype → parallel agent build; link `docs/product/`), disclaimer "Echo is not a therapist."
- [ ] `npm run check` passes.

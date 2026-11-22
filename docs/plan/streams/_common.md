# Rules for every stream (read with your brief)

You are one of several agents building Echo Journal in parallel. Each agent works in its own git worktree and branch. The orchestrator reviews your branch and merges it into `dev`.

## Mode

GitHub remote `origin` (repo `edgergard/echo-journal`, public). Your branch is already checked out in this worktree, based on `dev`.

## Setup (do first)

1. `npm ci` (never `npm install`). If package-lock.json then shows as modified, `git checkout -- package-lock.json`.
2. Run `npm run check` once to confirm a green baseline. If it is red before you changed anything, report `STATUS: escalation`.
   Run `npm ci` again whenever integrating `dev` changes package-lock.json.

## Read first

`CLAUDE.md` (project rules: Server Components by default, `src/server/` is server-only, env only via `@/env`, named exports, kebab-case files, no `any`, tests next to the file as `*.test.tsx`, accessibility rules), `docs/plan/PLAN.md` (contracts, ownership, assumptions), `docs/product/design.md` (screens, states, copy — UI language `en`, copy verbatim), `docs/product/idea.md` (Must list). Library APIs: look them up (vercel skills, `node_modules/next/dist/docs/`, Context7) — never from memory.

## Backend model (important)

- Contracts you build against and must NOT modify: `src/contracts/**` (types, zod schemas, backend interfaces), `src/server/backend.ts` (`getBackend()` wiring), `src/server/demo/**` (seed + shared in-memory store), `src/lib/routes.ts`, `src/env.ts`, `supabase/migrations/**`.
- **Demo mode:** without Supabase env vars the app uses in-memory implementations seeded from `src/server/demo/seed.ts`; without `OPENROUTER_API_KEY` it uses a fake AI that streams canned text. Your feature must work fully in demo mode (CI and other agents have no keys). The real implementation (Supabase / OpenRouter) lives next to the in-memory one in your own folder; `getBackend()` already picks between them.
- UI uses the shadcn components in `src/components/ui/**` and theme tokens (`bg-background`, `text-muted-foreground`, `bg-primary`, `font-heading`/`font-serif` for Literata) — never hard-coded hex.

## Environment notes

- GitHub: if `gh` says the repo is not found, the active gh account is a different one. Run that one command with the owner's token: `GH_TOKEN="$(gh auth token --user edgergard)" gh pr create --repo edgergard/echo-journal ...` (PowerShell: `$env:GH_TOKEN = (gh auth token --user edgergard); gh ...; Remove-Item Env:GH_TOKEN`). Never run `gh auth switch`.
- Env: if `.env.local` was copied into your worktree it holds dev keys; otherwise there is no env file — demo mode. In the report, say whether you exercised real services or demo mode.
- Browser checks: `npm run dev` may return 500 from background shells on Windows (Turbopack CSS worker). Use `npm run build` then `npx next start --port <your port>`, and drive it with the project's Playwright CLI: `npx playwright cli open http://localhost:<port>`, then `snapshot` / `click` / `screenshot` (see `.claude/skills/playwright-cli`; it uses the installed Chrome — don't install browsers). Close only your own browser with `npx playwright cli close` and stop the `next start` you launched; never `kill-all` or `close-all`. If the browser can't run, say so in the report.

## Known pitfalls

- Demo mode first: the in-memory backend and fake AI must keep working; never make a page require env vars (L-029).
- **Cache Components are on:** `cookies()`, `headers()`, `params`, `searchParams` (and so `requireSession()` and `getBackend()` reads of user data) must run inside a `<Suspense>` boundary, or `next build` fails with a blocking-prerender error. Follow the stubs: the page renders a static heading and `<Suspense fallback={…}><AsyncContent /></Suspense>`; pass `props.params` / `props.searchParams` promises down and await them inside. Route segment config (`export const runtime`, `dynamic`, `revalidate`) is not allowed.
- `route.ts` files may export only HTTP handlers; put schemas and helpers elsewhere (API schemas live in `src/contracts/api.ts`).
- `src/app/(app)/layout.tsx` already renders the AppHeader and the page's `<main>`; app pages render their content only (no second `<main>`), one `h1` each.
- `"use cache"` / `cacheLife()` only work inside Next.js; keep testable logic in plain functions (CLAUDE.md). Pages that read the session are dynamic — don't cache per-user data.

## You must NOT

- Edit files outside your ownership — including package.json, lockfile, `src/app/layout.tsx`, `src/app/(app)/layout.tsx`, `src/app/globals.css`, `src/components/ui/**`, `src/components/app-header.tsx`, contracts, env schema, CI, `.claude/`, `docs/plan/`, `docs/product/`.
- Add dependencies (escalate instead).
- Merge into `dev`, force-push, `git reset --hard`, or touch other `stream/*` branches.
- Rebase after your branch has been pushed (use `git merge` instead).

## Escalation

If you need a contract change, a shared-file edit, a new dependency, or you are blocked: stop, commit what you have, push, and finish your turn with the report using `STATUS: escalation` and an `ESCALATION:` line saying exactly what you need and why. Do not work around it.

## Definition of done

1. All acceptance criteria in your brief met; `npm run check` passes.
2. Get the latest `dev`: before your first push `git fetch origin && git rebase origin/dev`; after your branch has been pushed `git fetch origin && git merge origin/dev` (never rebase). Then `npm ci` if package-lock.json changed, and re-run `npm run check`.
3. Conventional commits, only files in your ownership.
4. `git push -u origin <your branch>`, then `gh pr create --base dev` (body: what changed / how to verify). Do NOT merge it. Later pushes: plain `git push`.
5. Finish your turn with the report below. If the orchestrator later sends feedback, fix it, re-run checks, push, and report again in the same format.

## Report format (your final message)

STATUS: done | partial | escalation
BRANCH: <branch> PR: <url or none> HEAD: <short sha>
ESCALATION: <need + why — only when STATUS is escalation>
DONE: <bullets>
NOT DONE / KNOWN ISSUES: <bullets>
CHECKS: <command → result>
FILES CHANGED OUTSIDE OWNERSHIP: none | <list with reason>

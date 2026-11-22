# Stream 1-auth: landing, sign-in, demo, auth gate, settings

First read and follow `docs/plan/streams/_common.md` (setup, rules, report). Branch: `stream/1-auth`. Dev-server port: **3101**.

## Task

Make it possible to enter Echo: a landing page with "Try the demo", sign-in by email magic link or GitHub, the auth callback, an auth gate for app pages, and the settings page (account, replies left today, about/disclaimer, sign out, delete account, reset demo data).

## Context

- Design: screens `landing`, `sign-in`, `settings`; flows `demo` (step 1) and `signup` (steps 1–2) in `docs/product/design.md` — every listed state, copy verbatim, per-screen accessibility notes. Visual reference: `docs/product/prototype/journal.dc.html` for header/typography feel (there is no prototype of your screens; follow design.md and the Direction).
- Contracts: `AuthService` and `Session` in `src/contracts/backend.ts` / `src/contracts/session.ts`; `getBackend().auth`; `getBackend().usage.remaining(userId)` for "Replies left today"; `src/lib/routes.ts`.
- Stubs prepared for you: `src/app/page.tsx`, `src/app/sign-in/page.tsx`, `src/app/auth/callback/route.ts`, `src/app/(app)/settings/page.tsx`, `src/proxy.ts`, `src/server/auth/memory.ts` (working demo-cookie session), `src/server/auth/supabase.ts` (stub), `src/server/auth/require-session.ts` (used by other streams' pages — keep its exported signature).
- Real mode: `@supabase/ssr` (server client with cookies in Server Components / Route Handlers / `proxy.ts`), magic link `signInWithOtp` with `emailRedirectTo` → `/auth/callback?next=…`, GitHub `signInWithOAuth`, demo sign-in with `DEMO_USER_EMAIL`/`DEMO_USER_PASSWORD` (server-only), delete account and reset demo data with the service-role client (server-only). Demo mode: "Try the demo" sets the demo session; email/GitHub buttons show "Email sign-in isn't set up in this preview. Try the demo instead." (role=status).
- Auth gate: `src/proxy.ts` — no session on `/journal`, `/week`, `/settings` (and their children) → redirect to `/sign-in?next=<path>`; a session on `/` or `/sign-in` → `/journal`. Pages also call `requireSession()` (defense in depth). In real mode the proxy refreshes the Supabase session cookie.

## You own (edit ONLY these paths)

- src/app/page.tsx, src/app/page.test.tsx
- src/app/sign-in/**
- src/app/auth/**
- src/app/(app)/settings/**
- src/proxy.ts, src/proxy.test.ts
- src/server/auth/**
- src/components/auth/**, src/components/settings/**, src/components/landing/**

## Acceptance criteria

- [ ] Landing: one h1, "Try the demo" (primary) signs in to the demo and lands on `/journal`; loading and error states as in design.md; static preview of an entry + reply with one recalled note (markup in `src/components/landing/`); footer line "Not a therapist. Not medical advice." and a link to the GitHub repo.
- [ ] Sign-in: email field with zod validation (React Hook Form), "Email me a link" → sent state with the address and "Use a different email"; "Continue with GitHub"; "Try the demo instead"; errors per design.md; works in demo mode with the message above.
- [ ] `/auth/callback` exchanges the code and redirects to `next` (only same-origin relative paths) or `/journal`.
- [ ] Proxy gate behaves as described in both modes; unit-tested redirect logic (pure function).
- [ ] Settings: account line (email or "Demo account"), "Replies left today: {n} of {limit}", About Echo (disclaimer + a crisis-line pointer: "If you're in crisis, contact local emergency services or find a helpline at findahelpline.com."), "Sign out", "Delete account" with alert-dialog confirmation (hidden for demo), "Reset demo data" (demo only); results announced with role=status.
- [ ] Tests: sign-in form validation, redirect logic, settings rendering for demo vs real session (with the memory backend).
- [ ] `npm run check` passes.
- [ ] UI: tokens only, visible focus, labels, works at 360px and desktop widths.

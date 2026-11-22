/** Path helpers shared by every screen. */
export const routes = {
  landing: "/",
  signIn: (next?: string) =>
    next ? `/sign-in?next=${encodeURIComponent(next)}` : "/sign-in",
  authCallback: "/auth/callback",
  journal: "/journal",
  newEntry: "/journal/new",
  entry: (id: string) => `/journal/${encodeURIComponent(id)}`,
  week: (weekStart?: string) =>
    weekStart ? `/week?week=${weekStart}` : "/week",
  settings: "/settings",
  api: {
    reflect: "/api/reflect",
    week: (weekStart: string) => `/api/week?weekStart=${weekStart}`,
  },
} as const;

/** Paths that need a session (the proxy and pages both check). */
export const PROTECTED_PREFIXES = ["/journal", "/week", "/settings"] as const;

/** Only same-origin relative paths are allowed as a post-sign-in target. */
export function safeNextPath(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return routes.journal;
  }
  return next;
}

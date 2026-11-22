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

const PROBE_ORIGIN = "http://same-origin.invalid";

/**
 * Only same-origin relative paths are allowed as a post-sign-in target.
 * Rejects backslashes and control characters (browsers treat `\` as `/` and
 * strip tabs/newlines, so `/\evil.com` would leave the site), then confirms
 * the parsed URL keeps our origin. Returns the normalized path.
 */
export function safeNextPath(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || /[\\\u0000-\u001f\u007f]/.test(next)) {
    return routes.journal;
  }
  try {
    const url = new URL(next, PROBE_ORIGIN);
    if (url.origin !== PROBE_ORIGIN) return routes.journal;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return routes.journal;
  }
}

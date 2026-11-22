import "server-only";

import { PROTECTED_PREFIXES, routes } from "@/lib/routes";

/** Pages a signed-in visitor has no reason to see. */
const SIGNED_OUT_ONLY = new Set<string>([routes.landing, "/sign-in"]);

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export interface GateInput {
  pathname: string;
  /** The URL's query string including "?", or "". */
  search: string;
  signedIn: boolean;
}

/**
 * The auth gate's decision: where to redirect, or null to let the request
 * through. No session on an app page → sign-in with `next`; a session on the
 * landing or sign-in page → the journal.
 */
export function authRedirect({
  pathname,
  search,
  signedIn,
}: GateInput): string | null {
  if (!signedIn && isProtectedPath(pathname)) {
    return routes.signIn(`${pathname}${search}`);
  }
  if (signedIn && SIGNED_OUT_ONLY.has(pathname)) {
    return routes.journal;
  }
  return null;
}

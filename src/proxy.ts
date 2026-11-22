import { NextResponse, type NextRequest } from "next/server";

import { authRedirect } from "@/server/auth/gate";
import { readProxySession } from "@/server/auth/proxy-session";

/** Headers @supabase/ssr sets with auth cookies so CDNs don't cache them. */
const NO_CACHE_HEADERS = ["cache-control", "expires", "pragma"] as const;

/**
 * Auth gate: no session on /journal, /week, /settings → /sign-in?next=…;
 * a session on / or /sign-in → /journal. In Supabase mode it also refreshes
 * the session cookie. Pages re-check with `requireSession()`.
 */
export async function proxy(request: NextRequest) {
  const { signedIn, response } = await readProxySession(request);
  const target = authRedirect({
    pathname: request.nextUrl.pathname,
    search: request.nextUrl.search,
    signedIn,
  });
  if (!target) return response;

  const redirect = NextResponse.redirect(new URL(target, request.url));
  // Keep refreshed Supabase cookies (and their no-cache headers) on redirects.
  for (const cookie of response.cookies.getAll()) {
    redirect.cookies.set(cookie);
  }
  for (const header of NO_CACHE_HEADERS) {
    const value = response.headers.get(header);
    if (value) redirect.headers.set(header, value);
  }
  return redirect;
}

export const config = {
  matcher: [
    "/",
    "/sign-in",
    "/journal/:path*",
    "/week/:path*",
    "/settings/:path*",
  ],
};

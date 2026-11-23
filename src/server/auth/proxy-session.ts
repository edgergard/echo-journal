import "server-only";

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { env } from "@/env";

import { DEMO_SESSION_COOKIE, DEMO_SESSION_VALUE } from "./demo-cookie";
import { logAuthError } from "./log";

export interface ProxySession {
  signedIn: boolean;
  /** Lets the request through, carrying any refreshed auth cookies. */
  response: NextResponse;
}

/**
 * Reads the session in the proxy. Supabase mode (same check as
 * `isSupabaseConfigured()` in src/server/backend.ts) validates the JWT and
 * writes refreshed auth cookies to both the request and the response; demo
 * mode only looks at the demo cookie.
 */
export async function readProxySession(
  request: NextRequest,
): Promise<ProxySession> {
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return {
      signedIn:
        request.cookies.get(DEMO_SESSION_COOKIE)?.value === DEMO_SESSION_VALUE,
      response: NextResponse.next({ request }),
    };
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
        for (const [key, value] of Object.entries(headers)) {
          response.headers.set(key, value);
        }
      },
    },
  });

  try {
    // Validates the JWT and refreshes an expiring session (via setAll).
    const { data } = await supabase.auth.getClaims();
    return { signedIn: Boolean(data?.claims), response };
  } catch (error) {
    logAuthError("proxy getClaims", error);
    return { signedIn: false, response };
  }
}

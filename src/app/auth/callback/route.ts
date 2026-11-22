import { NextResponse, type NextRequest } from "next/server";

import { routes, safeNextPath } from "@/lib/routes";
import { logAuthError } from "@/server/auth/log";
import { getBackend } from "@/server/backend";

/**
 * Magic-link / OAuth landing: exchanges the code for a session cookie and
 * opens `next` (same-origin paths only, via `safeNextPath`) or the journal.
 * On failure → sign-in with `error=callback` so the page can explain.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));
  if (code) {
    try {
      const result = await getBackend().auth.exchangeCode(code);
      if (result.ok) return NextResponse.redirect(new URL(next, origin));
    } catch (error) {
      logAuthError("exchangeCode", error);
    }
  } else {
    // Supabase reports expired / invalid links as ?error=…&error_code=….
    // Query values are visitor-controlled: keep them short.
    logAuthError("callback", {
      name: "AuthCallbackError",
      message: (
        searchParams.get("error_description") ?? "no code in callback"
      ).slice(0, 200),
      code: searchParams.get("error_code")?.slice(0, 64),
    });
  }
  const signIn = new URL(routes.signIn(next), origin);
  signIn.searchParams.set("error", "callback");
  return NextResponse.redirect(signIn);
}

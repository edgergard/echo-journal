import { NextResponse, type NextRequest } from "next/server";

import { routes, safeNextPath } from "@/lib/routes";
import { getBackend } from "@/server/backend";

/**
 * Magic-link / OAuth landing: exchanges the code for a session cookie and
 * opens `next` (same-origin paths only) or the journal. On failure → sign-in
 * with `error=callback` so the page can explain.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));
  if (code) {
    try {
      const result = await getBackend().auth.exchangeCode(code);
      if (result.ok) return NextResponse.redirect(new URL(next, origin));
    } catch {
      // Fall through to the sign-in page.
    }
  }
  const signIn = new URL(routes.signIn(next), origin);
  signIn.searchParams.set("error", "callback");
  return NextResponse.redirect(signIn);
}

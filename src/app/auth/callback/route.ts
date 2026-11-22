import { NextResponse, type NextRequest } from "next/server";

import { routes, safeNextPath } from "@/lib/routes";
import { getBackend } from "@/server/backend";

/** Exchanges the magic-link / OAuth code. Stream 1-auth finishes it. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));
  if (code) {
    const result = await getBackend().auth.exchangeCode(code);
    if (result.ok) return NextResponse.redirect(new URL(next, origin));
  }
  return NextResponse.redirect(new URL(routes.signIn(next), origin));
}

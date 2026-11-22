import { NextResponse, type NextRequest } from "next/server";

/**
 * Auth gate (stub: lets every request through).
 * Stream 1-auth implements: no session on /journal, /week, /settings →
 * /sign-in?next=…; a session on / or /sign-in → /journal; Supabase cookie refresh.
 */
export function proxy(request: NextRequest) {
  void request;
  return NextResponse.next();
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

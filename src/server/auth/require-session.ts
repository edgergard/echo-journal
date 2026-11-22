import "server-only";

import { redirect } from "next/navigation";

import type { Session } from "@/contracts/session";
import { routes } from "@/lib/routes";
import { getBackend } from "@/server/backend";

/**
 * The signed-in session, or a redirect to /sign-in. Call it inside a
 * <Suspense> boundary (it reads cookies). Signature is a contract.
 */
export async function requireSession(next?: string): Promise<Session> {
  const session = await getBackend().auth.getSession();
  if (!session) redirect(routes.signIn(next));
  return session;
}

import { after } from "next/server";

import { getBackend } from "@/server/backend";
import { handleReflect } from "@/server/reflections/reflect";

/**
 * Runs on the Node.js runtime (the default; segment config `runtime` is not
 * allowed with Cache Components).
 * POST { entryId, regenerate? } → text stream of Echo's reply.
 * Headers: `x-echo-status` (streaming | done | crisis | limit) and
 * `x-echo-recalled` (URI-encoded JSON RecalledRef[]) — see src/contracts/api.ts.
 * The pipeline lives in src/server/reflections/reflect.ts.
 */
export async function POST(request: Request) {
  const backend = getBackend();
  return handleReflect(request, {
    backend,
    getSession: () => backend.auth.getSession(),
    waitUntil: (work) => after(() => work),
  });
}

import { ReflectRequestSchema } from "@/contracts/api";

/**
 * Runs on the Node.js runtime (the default; segment config `runtime` is not
 * allowed with Cache Components).
 * POST { entryId, regenerate? } → text stream of Echo's reply.
 * Headers: `x-echo-status` (streaming | done | crisis | limit) and
 * `x-echo-recalled` (URI-encoded JSON RecalledRef[]) — see src/contracts/api.ts.
 * Stub — stream 1-ai implements it.
 */
export async function POST(request: Request) {
  const parsed = ReflectRequestSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  return Response.json({ error: "Not implemented" }, { status: 501 });
}

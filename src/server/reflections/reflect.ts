import "server-only";

import {
  REFLECT_RECALLED_HEADER,
  REFLECT_STATUS_HEADER,
  ReflectRequestSchema,
  type ReflectStreamStatus,
} from "@/contracts/api";
import type { Backend, SimilarEntry } from "@/contracts/backend";
import type {
  Entry,
  RecalledRef,
  Reflection,
  ReflectionStatus,
} from "@/contracts/journal";
import type { Session } from "@/contracts/session";
import { isCrisisText } from "@/server/ai/crisis";
import { toRecalledRef } from "@/server/memory/recall";
import { dailyLimitMessage } from "@/server/usage/messages";

/** How many past entries Echo recalls for one reply. */
export const RECALL_COUNT = 3;

export interface ReflectDeps {
  backend: Pick<Backend, "entries" | "reflections" | "memory" | "ai" | "usage">;
  getSession: () => Promise<Session | null>;
  /** Keeps generating (and saving) after the client disconnects. */
  waitUntil?: (work: Promise<unknown>) => void;
}

/** A reply response: a text body plus the status and recalled headers. */
export function reflectResponse(
  body: BodyInit | null,
  status: ReflectStreamStatus,
  recalled: RecalledRef[],
): Response {
  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
      "x-accel-buffering": "no",
      [REFLECT_STATUS_HEADER]: status,
      [REFLECT_RECALLED_HEADER]: encodeURIComponent(JSON.stringify(recalled)),
    },
  });
}

const jsonError = (error: string, status: number) =>
  Response.json(
    { error },
    { status, headers: { "cache-control": "no-store" } },
  );

/** Similar older entries; memory problems never block the reply. */
async function recall(
  memory: Backend["memory"],
  userId: string,
  entry: Entry,
): Promise<SimilarEntry[]> {
  try {
    await memory.index(userId, entry);
    const similar = await memory.similar(userId, entry, RECALL_COUNT);
    return similar
      .filter(
        (s) => s.entry.id !== entry.id && s.entry.createdAt < entry.createdAt,
      )
      .slice(0, RECALL_COUNT);
  } catch (error) {
    console.error("Echo memory failed; replying without recall", error);
    return [];
  }
}

/** Starts the model stream and waits for its first non-empty chunk. */
async function startStream(
  chunks: AsyncIterable<string>,
): Promise<{ iterator: AsyncIterator<string>; first: string }> {
  const iterator = chunks[Symbol.asyncIterator]();
  for (;;) {
    const next = await iterator.next();
    if (next.done) throw new Error("The model returned an empty reply");
    if (next.value) return { iterator, first: next.value };
  }
}

/**
 * POST /api/reflect: session → entry → existing reply → crisis guard →
 * daily limit → memory → streamed reply, saved when it finishes.
 * Errors never touch the entry; a failed regenerate keeps the old reply.
 */
export async function handleReflect(
  request: Request,
  deps: ReflectDeps,
): Promise<Response> {
  const session = await deps.getSession();
  if (!session) return jsonError("Not signed in", 401);

  const parsed = ReflectRequestSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) return jsonError("Invalid request", 400);
  const { entryId, regenerate = false } = parsed.data;

  const { backend } = deps;
  const { userId } = session;
  const entry = await backend.entries.get(userId, entryId);
  if (!entry) return jsonError("Entry not found", 404);

  const existing = await backend.reflections.get(userId, entry.id);
  if (existing && !regenerate) {
    if (existing.status === "done") {
      return reflectResponse(existing.text, "done", existing.recalled);
    }
    if (existing.status === "crisis") {
      return reflectResponse(null, "crisis", []);
    }
    // A saved "limit" or "error" is not a reply: try again.
  }
  const keepExisting = existing?.status === "done";

  const save = (
    status: ReflectionStatus,
    text: string,
    recalled: RecalledRef[] = [],
  ) => {
    const reflection: Reflection = {
      entryId: entry.id,
      status,
      text,
      recalled,
      createdAt: new Date().toISOString(),
    };
    return backend.reflections.save(userId, reflection);
  };

  // Crisis guard: no model call and no quota used.
  if (isCrisisText(entry.text)) {
    await save("crisis", "");
    return reflectResponse(null, "crisis", []);
  }

  const usage = await backend.usage.consume(userId);
  if (!usage.allowed) {
    const message = dailyLimitMessage(backend.usage.limit());
    if (!keepExisting) await save("limit", message);
    return reflectResponse(message, "limit", []);
  }

  const similar = await recall(backend.memory, userId, entry);
  const recalled = similar.map((s) => ({
    entry: s.entry,
    ref: toRecalledRef(s.entry, entry),
  }));
  const refs = recalled.map((r) => r.ref);

  const saveError = async (error: unknown) => {
    console.error("Echo couldn't reply", error);
    if (keepExisting) return;
    try {
      await save("error", "");
    } catch (saveFailure) {
      console.error("Couldn't record the failed reply", saveFailure);
    }
  };

  let started: { iterator: AsyncIterator<string>; first: string };
  try {
    started = await startStream(
      backend.ai.streamReflection({ entry, recalled }),
    );
  } catch (error) {
    await saveError(error);
    return jsonError("Echo couldn't reply right now", 502);
  }
  const { iterator, first } = started;

  const encoder = new TextEncoder();
  let open = true;
  let finished: Promise<void> = Promise.resolve();
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      const push = (chunk: string) => {
        if (!open) return;
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          open = false;
        }
      };
      // Generation runs to the end even if the client goes away, so the
      // reply is saved and shown next time.
      finished = (async () => {
        let text = first;
        push(first);
        try {
          for (;;) {
            const next = await iterator.next();
            if (next.done) break;
            text += next.value;
            push(next.value);
          }
          const reply = text.trim();
          if (!reply) throw new Error("The model returned an empty reply");
          await save("done", reply, refs);
          if (open) controller.close();
        } catch (error) {
          await saveError(error);
          if (open) controller.error(error);
        } finally {
          open = false;
        }
      })();
    },
    cancel() {
      open = false;
    },
  });
  deps.waitUntil?.(finished);

  return reflectResponse(body, "streaming", refs);
}

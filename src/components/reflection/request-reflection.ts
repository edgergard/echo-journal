import {
  REFLECT_RECALLED_HEADER,
  REFLECT_STATUS_HEADER,
  type ReflectRequest,
  ReflectStreamStatusSchema,
  type ReflectStreamStatus,
} from "@/contracts/api";
import { type RecalledRef, RecalledRefSchema } from "@/contracts/journal";
import { routes } from "@/lib/routes";

/** Decodes the `x-echo-recalled` header; anything malformed means none. */
export function parseRecalledHeader(value: string | null): RecalledRef[] {
  if (!value) return [];
  try {
    const parsed = RecalledRefSchema.array()
      .max(3)
      .safeParse(JSON.parse(decodeURIComponent(value)));
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}

export interface ReflectResult {
  status: ReflectStreamStatus;
  recalled: RecalledRef[];
  text: string;
}

/** The model is rate-limited or overloaded (HTTP 503): try again later. */
export class ModelBusyError extends Error {
  constructor() {
    super("Echo's model is busy");
    this.name = "ModelBusyError";
  }
}

/**
 * How long to wait for a reply that is already being generated elsewhere
 * (another tab, a reload): the server answers 409 until it is saved.
 * Mutable so tests can make the wait instant.
 */
export const GENERATING_RETRY = { attempts: 6, delayMs: 2000 };

const GENERATING = Symbol("generating");

async function postOnce(
  request: ReflectRequest,
  onText: (textSoFar: string) => void,
): Promise<ReflectResult | typeof GENERATING> {
  const response = await fetch(routes.api.reflect, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(request),
  });
  if (response.status === 409) return GENERATING;
  if (response.status === 503) throw new ModelBusyError();
  if (!response.ok) {
    throw new Error(`Echo couldn't reply (HTTP ${response.status})`);
  }
  const status = ReflectStreamStatusSchema.parse(
    response.headers.get(REFLECT_STATUS_HEADER),
  );
  const recalled = parseRecalledHeader(
    response.headers.get(REFLECT_RECALLED_HEADER),
  );

  let text = "";
  if (response.body) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      text += decoder.decode(value, { stream: true });
      if (status === "streaming") onText(text);
    }
    text += decoder.decode();
  }
  text = text.trim();
  if ((status === "streaming" || status === "done") && !text) {
    throw new Error("Echo's reply was empty");
  }
  return { status, recalled, text };
}

const wait = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * POSTs /api/reflect and reads the text stream to the end, reporting the
 * reply so far through `onText` while it streams. While the same reply is
 * still being generated elsewhere it waits and asks again, a few times.
 * Throws on any failure — `ModelBusyError` when the model is rate-limited —
 * including a stream that breaks off or ends empty.
 */
export async function requestReflection(
  request: ReflectRequest,
  onText: (textSoFar: string) => void,
): Promise<ReflectResult> {
  for (let attempt = 0; ; attempt += 1) {
    const result = await postOnce(request, onText);
    if (result !== GENERATING) return result;
    if (attempt >= GENERATING_RETRY.attempts) {
      throw new Error("Echo is still replying elsewhere");
    }
    await wait(GENERATING_RETRY.delayMs);
  }
}

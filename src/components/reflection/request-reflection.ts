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

/**
 * POSTs /api/reflect and reads the text stream to the end, reporting the
 * reply so far through `onText` while it streams. Throws on any failure,
 * including a stream that breaks off or ends empty.
 */
export async function requestReflection(
  request: ReflectRequest,
  onText: (textSoFar: string) => void,
): Promise<ReflectResult> {
  const response = await fetch(routes.api.reflect, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(request),
  });
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

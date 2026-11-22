import "server-only";

/** HTTP statuses that mean "the model is rate-limited or overloaded". */
const BUSY_STATUSES = new Set([429, 503]);

const BUSY_MESSAGE = /rate[\s-]?limit|too many requests|overloaded/i;

const asRecord = (value: unknown): Record<string, unknown> | null =>
  typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;

const isBusyStatus = (value: unknown) =>
  (typeof value === "number" || typeof value === "string") &&
  BUSY_STATUSES.has(Number(value));

/**
 * True when a model call failed because the provider is rate-limited or
 * overloaded (HTTP 429 / 503) — e.g. an OpenRouter `:free` model. Looks
 * through AI SDK wrappers: `APICallError.statusCode` and `.data.error.code`,
 * `RetryError.lastError` / `.errors`, and `cause`.
 */
export function isModelBusyError(error: unknown, depth = 0): boolean {
  const record = asRecord(error);
  if (!record || depth > 4) return false;
  if (
    isBusyStatus(record.statusCode) ||
    isBusyStatus(record.status) ||
    isBusyStatus(record.code)
  ) {
    return true;
  }
  const data = asRecord(record.data);
  if (data && isBusyStatus(asRecord(data.error)?.code)) return true;
  if (typeof record.message === "string" && BUSY_MESSAGE.test(record.message)) {
    return true;
  }
  const nested = [
    record.lastError,
    record.cause,
    record.error,
    ...(Array.isArray(record.errors) ? record.errors : []),
  ];
  return nested.some((inner) => isModelBusyError(inner, depth + 1));
}

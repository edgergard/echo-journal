import "server-only";

/** Email-like substrings (Supabase messages can quote the address). */
const EMAIL_PATTERN = /[^\s"'<>()@]+@[^\s"'<>()]+/g;

function redact(text: string): string {
  return text.replace(EMAIL_PATTERN, "[email]");
}

export interface ErrorSummary {
  name?: string;
  message: string;
  status?: number;
  code?: string;
  stack?: string;
}

/**
 * A loggable summary of an auth or database error: name, message, HTTP status,
 * error code and stack, with emails redacted. Request data (tokens, auth codes,
 * PostgREST `details` with row values) is never included.
 */
export function describeError(error: unknown): ErrorSummary {
  if (typeof error !== "object" || error === null) {
    return { message: redact(String(error)) };
  }
  const record = error as Record<string, unknown>;
  const summary: ErrorSummary = {
    message:
      typeof record.message === "string" ? redact(record.message) : "unknown",
  };
  if (typeof record.name === "string") summary.name = record.name;
  if (typeof record.status === "number") summary.status = record.status;
  if (typeof record.code === "string") summary.code = record.code;
  if (error instanceof Error && error.stack)
    summary.stack = redact(error.stack);
  return summary;
}

/** `console.error("[auth] <op> failed", …)` with a redacted error summary. */
export function logAuthError(operation: string, error: unknown): void {
  console.error(`[auth] ${operation} failed`, describeError(error));
}

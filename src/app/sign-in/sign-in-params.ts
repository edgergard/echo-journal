import { safeNextPath } from "@/lib/routes";

/** /auth/callback adds `?error=callback` when it can't finish a sign-in. */
export const CALLBACK_ERROR = "callback";

type SearchParams = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** The sign-in page's query: a safe `next` path and the callback error flag. */
export function parseSignInParams(params: SearchParams): {
  next: string;
  callbackFailed: boolean;
} {
  return {
    next: safeNextPath(firstValue(params.next)),
    callbackFailed: firstValue(params.error) === CALLBACK_ERROR,
  };
}

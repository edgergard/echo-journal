import "server-only";

import { headers } from "next/headers";

/** The public origin of the current request, e.g. "https://echo.example". */
export async function getRequestOrigin(): Promise<string> {
  const list = await headers();
  const host = list.get("x-forwarded-host") ?? list.get("host");
  if (host) {
    const proto =
      list.get("x-forwarded-proto")?.split(",")[0]?.trim() ??
      (/^(localhost|127\.0\.0\.1)(:|$)/.test(host) ? "http" : "https");
    return `${proto}://${host}`;
  }
  const origin = list.get("origin");
  if (origin) return origin;
  throw new Error("Cannot determine the request origin");
}

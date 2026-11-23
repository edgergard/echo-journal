import "server-only";

import { env } from "@/env";

/** The canonical origin (no trailing slash) for metadata, robots and sitemap. */
export function siteUrl(): string {
  if (env.SITE_URL) return env.SITE_URL.replace(/\/$/, "");
  if (env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  return "http://localhost:3000";
}

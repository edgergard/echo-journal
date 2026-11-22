import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

import { cacheLife } from "next/cache";

/**
 * Returns the project README. Cached with `use cache` (Cache Components are on
 * in next.config.ts), so the file is read at build time, not on every request.
 */
export async function getReadme(): Promise<string> {
  "use cache";
  cacheLife("max");

  return readFile(path.join(process.cwd(), "README.md"), "utf8");
}

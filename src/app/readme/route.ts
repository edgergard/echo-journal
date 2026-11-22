import { getReadme } from "@/server/readme";

/**
 * Serves README.md as plain text so the home page can link to it.
 * Development only: a deployed project must not publish its internal README.
 */
export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return new Response("Not Found", { status: 404 });
  }
  return new Response(await getReadme(), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

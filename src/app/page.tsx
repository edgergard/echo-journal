import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { routes } from "@/lib/routes";
import { getBackend } from "@/server/backend";

/** Stub landing — stream 1-auth builds the real one (design.md: landing). */
async function tryDemo() {
  "use server";
  const result = await getBackend().auth.signInDemo();
  if (result.ok) redirect(routes.journal);
}

export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center gap-6 px-6 py-16">
      <h1 className="font-heading text-5xl font-medium">
        A journal that remembers.
      </h1>
      <form action={tryDemo}>
        <Button type="submit" size="lg">
          Try the demo
        </Button>
      </form>
    </main>
  );
}

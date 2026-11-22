import type { Metadata } from "next";
import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/lib/routes";
import { requireSession } from "@/server/auth/require-session";

export const metadata: Metadata = { title: "New entry" };

/** Stub — stream 1-entries builds it (design.md: new-entry). */
async function NewEntryForm() {
  await requireSession(routes.newEntry);
  return <p className="text-muted-foreground">The entry editor goes here.</p>;
}

export default function NewEntryPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-8 font-heading text-4xl font-medium">New entry</h1>
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <NewEntryForm />
      </Suspense>
    </div>
  );
}

import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

import { formatLongDate } from "@/components/entries/mood";
import { NewEntryForm } from "@/components/entries/new-entry-form";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/lib/routes";
import { requireSession } from "@/server/auth/require-session";

export const metadata: Metadata = { title: "New entry" };

async function NewEntry() {
  // Today's date is per request: defer to request time before `new Date()`.
  await connection();
  await requireSession(routes.newEntry);
  return (
    <>
      <h1 className="mb-8 font-heading text-4xl font-medium">
        {formatLongDate(new Date())}
      </h1>
      <NewEntryForm />
    </>
  );
}

export default function NewEntryPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <Suspense
        fallback={
          <>
            <h1 className="mb-8 font-heading text-4xl font-medium">
              New entry
            </h1>
            <Skeleton className="h-64 w-full" />
          </>
        }
      >
        <NewEntry />
      </Suspense>
    </div>
  );
}

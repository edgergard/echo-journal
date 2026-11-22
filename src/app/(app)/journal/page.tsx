import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/lib/routes";
import { requireSession } from "@/server/auth/require-session";
import { getBackend } from "@/server/backend";

export const metadata: Metadata = { title: "Journal" };

/** Stub — stream 1-entries builds it (design.md: journal). */
async function JournalList() {
  const session = await requireSession(routes.journal);
  const { entries } = await getBackend().entries.list(session.userId);
  return (
    <ol className="flex flex-col gap-4">
      {entries.map((entry) => (
        <li key={entry.id}>
          <Link href={routes.entry(entry.id)} className="font-serif">
            {entry.text}
          </Link>
        </li>
      ))}
    </ol>
  );
}

export default function JournalPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-8 font-heading text-4xl font-medium">Journal</h1>
      {/* Request-time data (cookies) must sit inside <Suspense> (Cache Components). */}
      <Suspense fallback={<Skeleton className="h-40 w-full" />}>
        <JournalList />
      </Suspense>
    </div>
  );
}

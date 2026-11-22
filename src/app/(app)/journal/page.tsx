import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { EntryList } from "@/components/entries/entry-list";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/lib/routes";
import { requireSession } from "@/server/auth/require-session";
import { getBackend } from "@/server/backend";

export const metadata: Metadata = { title: "Journal" };

async function JournalContent({
  searchParams,
}: {
  searchParams: PageProps<"/journal">["searchParams"];
}) {
  const { deleted } = await searchParams;
  const session = await requireSession(routes.journal);
  const backend = getBackend();
  const page = await backend.entries.list(session.userId);
  const replied = await backend.reflections.repliedEntryIds(
    session.userId,
    page.entries.map((entry) => entry.id),
  );

  return (
    <>
      {deleted === "1" ? (
        <p role="status" className="mb-6 text-sm text-muted-foreground">
          Entry deleted
        </p>
      ) : null}
      {page.entries.length === 0 ? (
        <div className="flex flex-col items-start gap-5 rounded-lg border bg-card p-6 sm:p-8">
          <p className="font-serif text-xl">
            Your journal is empty. What&apos;s on your mind today?
          </p>
          <Link
            href={routes.newEntry}
            className={buttonVariants({ size: "lg" })}
          >
            Write your first entry
          </Link>
        </div>
      ) : (
        <EntryList
          initialEntries={page.entries}
          repliedIds={[...replied]}
          nextBefore={page.nextBefore}
        />
      )}
    </>
  );
}

export default function JournalPage(props: PageProps<"/journal">) {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-8 font-heading text-4xl font-medium">Journal</h1>
      {/* Request-time data (cookies) must sit inside <Suspense> (Cache Components). */}
      <Suspense fallback={<Skeleton className="h-40 w-full" />}>
        <JournalContent searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}

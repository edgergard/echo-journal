"use client";

import { useState, useTransition } from "react";

import { loadOlderEntriesAction } from "@/app/(app)/journal/actions";
import { Button } from "@/components/ui/button";
import type { Entry } from "@/contracts/journal";

import { EntryCard } from "./entry-card";

interface EntryListProps {
  initialEntries: Entry[];
  /** Ids of entries Echo has replied to. */
  repliedIds: string[];
  nextBefore: string | null;
}

/** Newest-first list with "Show older entries" pagination. */
export function EntryList({
  initialEntries,
  repliedIds,
  nextBefore,
}: EntryListProps) {
  const [entries, setEntries] = useState(initialEntries);
  const [replied, setReplied] = useState(() => new Set(repliedIds));
  const [cursor, setCursor] = useState(nextBefore);
  const [failed, setFailed] = useState(false);
  const [pending, startTransition] = useTransition();

  function showOlder() {
    if (!cursor) return;
    const before = cursor;
    setFailed(false);
    startTransition(async () => {
      const page = await loadOlderEntriesAction(before);
      if (!page) {
        setFailed(true);
        return;
      }
      setEntries((prev) => [...prev, ...page.entries]);
      setReplied((prev) => new Set([...prev, ...page.repliedIds]));
      setCursor(page.nextBefore);
    });
  }

  return (
    <>
      <ol className="flex flex-col gap-4">
        {entries.map((entry) => (
          <li key={entry.id}>
            <EntryCard entry={entry} replied={replied.has(entry.id)} />
          </li>
        ))}
      </ol>
      {failed ? (
        <p role="alert" className="mt-6 text-sm text-destructive">
          Couldn&apos;t load older entries. Try again.
        </p>
      ) : null}
      {cursor ? (
        <div className="mt-8">
          <Button
            variant="outline"
            size="lg"
            onClick={showOlder}
            disabled={pending}
            aria-busy={pending}
          >
            {pending ? "Loading…" : "Show older entries"}
          </Button>
        </div>
      ) : null}
    </>
  );
}

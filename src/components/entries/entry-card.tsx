import { MessageCircle } from "lucide-react";
import Link from "next/link";

import type { Entry } from "@/contracts/journal";
import { routes } from "@/lib/routes";

import { firstLine, formatEntryDate, MOOD_LABELS } from "./mood";

interface EntryCardProps {
  entry: Entry;
  /** Echo has replied to this entry. */
  replied?: boolean;
}

/** One journal entry in the list: a single link with a descriptive name. */
export function EntryCard({ entry, replied = false }: EntryCardProps) {
  const date = formatEntryDate(entry.createdAt);
  const mood = MOOD_LABELS[entry.mood];
  return (
    <Link
      href={routes.entry(entry.id)}
      aria-label={`${date}, ${mood}: ${firstLine(entry.text)}${replied ? ", Echo replied" : ""}`}
      className="block rounded-lg border bg-card px-5 py-5 text-card-foreground transition-colors outline-none hover:bg-accent focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 sm:px-6"
    >
      <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
        <time dateTime={entry.createdAt}>{date}</time>
        <span aria-hidden="true">·</span>
        <span>{mood}</span>
        {replied ? (
          <span className="ml-auto inline-flex items-center gap-1.5 text-primary">
            <MessageCircle className="size-3.5" aria-hidden="true" />
            Echo replied
          </span>
        ) : null}
      </div>
      <p className="line-clamp-2 font-serif text-lg leading-relaxed whitespace-pre-line">
        {entry.text}
      </p>
    </Link>
  );
}

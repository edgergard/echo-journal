import Link from "next/link";

import type { RecalledRef } from "@/contracts/journal";
import { routes } from "@/lib/routes";

/** "Nov 15" — UTC, the same day Echo names in its reply. */
export function formatRecalledDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export interface RecalledNoteProps {
  note: RecalledRef;
}

/**
 * A "Recalled" margin note: a pencil-line connector, the date, a short quote
 * from the past entry and a link to it (design.md: RecalledNote).
 */
export function RecalledNote({ note }: RecalledNoteProps) {
  const date = formatRecalledDate(note.date);
  return (
    <div className="flex items-start gap-3">
      <span
        aria-hidden="true"
        className="mt-2.5 h-0 w-6 flex-none border-t border-primary"
      />
      <div className="min-w-0 flex-1">
        <p className="text-[0.8125rem] text-muted-foreground">
          Recalled from {date}
        </p>
        <blockquote className="mt-1.5 font-serif text-base leading-[1.55] text-foreground italic">
          “{note.quote}”
        </blockquote>
        <Link
          href={routes.entry(note.entryId)}
          aria-label={`Open entry from ${date}`}
          className="mt-2 inline-block py-1 text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Open entry
        </Link>
      </div>
    </div>
  );
}

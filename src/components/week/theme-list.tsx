import Link from "next/link";

import { dayLabel } from "@/components/week/format";
import type { WeekTheme } from "@/contracts/journal";
import { routes } from "@/lib/routes";

interface ThemeListProps {
  themes: WeekTheme[];
  /** createdAt (ISO) by entry id, for the link labels. */
  entryDates: Record<string, string>;
}

export function ThemeList({ themes, entryDates }: ThemeListProps) {
  return (
    <ul className="flex flex-col gap-4">
      {themes.map((theme) => (
        <li
          key={theme.title}
          className="rounded-lg border border-border bg-card p-5 text-card-foreground"
        >
          <h3 className="font-heading text-xl font-medium">{theme.title}</h3>
          <p className="mt-2 text-foreground">{theme.text}</p>
          {theme.entryIds.length > 0 ? (
            <ul
              aria-label={`Entries for ${theme.title}`}
              className="mt-3 flex flex-wrap gap-x-4 gap-y-1"
            >
              {theme.entryIds.map((id) => {
                const date = entryDates[id];
                return (
                  <li key={id}>
                    <Link
                      href={routes.entry(id)}
                      className="rounded-sm text-sm text-primary underline underline-offset-4 outline-none hover:text-primary/80 focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      {date
                        ? `Entry · ${dayLabel(date.slice(0, 10))}`
                        : "Entry"}
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

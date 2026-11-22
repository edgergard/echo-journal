"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MoodChart } from "@/components/week/mood-chart";
import { ThemeList } from "@/components/week/theme-list";
import type { WeekSummary } from "@/contracts/journal";
import { routes } from "@/lib/routes";

export interface WeekViewData {
  summary: WeekSummary;
  entryDates: Record<string, string>;
}

interface WeekViewProps {
  initial: WeekViewData;
  /** Rebuilds the week; passed from the page so this stays presentational. */
  refresh: (weekStart: string) => Promise<WeekViewData>;
  dailyLimit: number;
}

export function WeekView({ initial, refresh, dailyLimit }: WeekViewProps) {
  const [data, setData] = useState(initial);
  const [failed, setFailed] = useState(false);
  const [pending, startTransition] = useTransition();

  const { summary, entryDates } = data;
  const status = failed ? "error" : summary.status;

  function reload() {
    startTransition(async () => {
      try {
        setData(await refresh(summary.weekStart));
        setFailed(false);
      } catch {
        setFailed(true);
      }
    });
  }

  return (
    <div className="flex flex-col gap-10">
      <section
        aria-labelledby="mood-heading"
        className="rounded-lg border border-border bg-card p-5 text-card-foreground sm:p-7"
      >
        <h2
          id="mood-heading"
          className="mb-4 text-xs font-semibold tracking-widest text-muted-foreground uppercase"
        >
          Mood
        </h2>
        <MoodChart days={summary.days} />
      </section>

      <section aria-labelledby="themes-heading" aria-busy={pending}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 id="themes-heading" className="font-heading text-2xl font-medium">
            Themes
          </h2>
          {status === "done" && !pending ? (
            <Button variant="outline" onClick={reload}>
              Refresh summary
            </Button>
          ) : null}
        </div>

        {pending ? (
          <div role="status" className="flex flex-col gap-3">
            <p className="text-muted-foreground">Echo is reading your week…</p>
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : status === "done" ? (
          <ThemeList themes={summary.themes} entryDates={entryDates} />
        ) : status === "empty" ? (
          <div className="flex flex-col items-start gap-4">
            <p className="text-muted-foreground">
              Write at least two entries this week to see a summary.
            </p>
            <Link href={routes.newEntry} className={buttonVariants()}>
              New entry
            </Link>
          </div>
        ) : status === "limit" ? (
          <p role="status" className="text-muted-foreground">
            You&apos;ve used today&apos;s {dailyLimit} replies. Echo will be
            back tomorrow.
          </p>
        ) : (
          <div role="status" className="flex flex-col items-start gap-4">
            <p className="text-muted-foreground">
              Couldn&apos;t build this week&apos;s summary.
            </p>
            <Button variant="outline" onClick={reload}>
              Try again
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}

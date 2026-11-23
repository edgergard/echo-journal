import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { weekRangeLabel } from "@/components/week/format";
import { WeekNav } from "@/components/week/week-nav";
import { WeekView } from "@/components/week/week-view";
import { routes } from "@/lib/routes";
import { requireSession } from "@/server/auth/require-session";
import { getBackend } from "@/server/backend";
import { buildWeekData } from "@/server/week/build-week-summary";
import {
  addDays,
  resolveWeekStart,
  weekStartOf,
} from "@/server/week/week-utils";

import { refreshWeek } from "./actions";

export const metadata: Metadata = { title: "This week" };

function WeekFallback() {
  return (
    <div role="status" className="flex flex-col gap-4">
      <p className="text-muted-foreground">Echo is reading your week…</p>
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}

async function WeekContent({ weekStart }: { weekStart: string }) {
  const session = await requireSession(routes.week(weekStart));
  const backend = getBackend();
  const data = await buildWeekData(backend, session.userId, weekStart);

  const isCurrent = weekStart === weekStartOf(new Date());
  const lastDay = addDays(weekStart, 6);

  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <p className="text-muted-foreground">
          {weekRangeLabel(weekStart, lastDay)}
        </p>
        <WeekNav
          previousWeek={addDays(weekStart, -7)}
          nextWeek={isCurrent ? null : addDays(weekStart, 7)}
        />
      </div>
      <WeekView
        key={weekStart}
        initial={data}
        refresh={refreshWeek}
        dailyLimit={backend.usage.limit()}
      />
    </>
  );
}

/** Resolves the week, then re-keys the inner boundary so navigation shows the loading state. */
async function WeekRoute({
  searchParams,
}: {
  searchParams: PageProps<"/week">["searchParams"];
}) {
  // The current week depends on today's date: request time only.
  await connection();
  const { week } = await searchParams;
  const requested = Array.isArray(week) ? week[0] : week;
  const weekStart = resolveWeekStart(requested);
  return (
    <Suspense key={weekStart} fallback={<WeekFallback />}>
      <WeekContent weekStart={weekStart} />
    </Suspense>
  );
}

export default function WeekPage(props: PageProps<"/week">) {
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-2 font-heading text-4xl font-medium">This week</h1>
      <Suspense fallback={<WeekFallback />}>
        <WeekRoute searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}

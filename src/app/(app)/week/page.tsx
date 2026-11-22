import type { Metadata } from "next";
import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/lib/routes";
import { requireSession } from "@/server/auth/require-session";

export const metadata: Metadata = { title: "This week" };

/** Stub — stream 1-week builds it (design.md: week). */
async function WeekContent() {
  await requireSession(routes.week());
  return <p className="text-muted-foreground">The week summary goes here.</p>;
}

export default function WeekPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-8 font-heading text-4xl font-medium">This week</h1>
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <WeekContent />
      </Suspense>
    </div>
  );
}

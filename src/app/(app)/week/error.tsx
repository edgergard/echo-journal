"use client";

import { Button } from "@/components/ui/button";

export default function WeekError({
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  return (
    <div
      role="status"
      className="mx-auto flex max-w-4xl flex-col items-start gap-4"
    >
      <h1 className="font-heading text-4xl font-medium">This week</h1>
      <p className="text-muted-foreground">
        Couldn&apos;t build this week&apos;s summary.
      </p>
      <Button variant="outline" onClick={retry}>
        Try again
      </Button>
    </div>
  );
}

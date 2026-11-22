"use client";

import { Button } from "@/components/ui/button";

export default function JournalError({
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  return (
    <div
      role="alert"
      className="mx-auto flex max-w-3xl flex-col items-start gap-4"
    >
      <h1 className="font-heading text-4xl font-medium">Journal</h1>
      <p className="text-muted-foreground">Couldn&apos;t load your entries.</p>
      <Button size="lg" onClick={() => retry()}>
        Try again
      </Button>
    </div>
  );
}

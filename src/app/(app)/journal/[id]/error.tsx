"use client";

import { Button } from "@/components/ui/button";

export default function EntryError({
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
      <h1 className="font-heading text-3xl font-medium">
        Couldn&apos;t load this entry.
      </h1>
      <Button size="lg" onClick={() => retry()}>
        Try again
      </Button>
    </div>
  );
}

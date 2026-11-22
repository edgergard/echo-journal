"use client"; // Error boundaries must be Client Components.

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

type ErrorPageProps = {
  error: unknown;
  retry: () => void;
};

export default function ErrorPage({ error, retry }: ErrorPageProps) {
  useEffect(() => {
    // Error boundaries swallow errors, so log them explicitly.
    console.error(error);
  }, [error]);

  // Server errors carry a digest that matches the server-side log entry.
  const digest =
    error instanceof Error &&
    "digest" in error &&
    typeof error.digest === "string"
      ? error.digest
      : undefined;

  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-start justify-center gap-4 px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">
        Something went wrong
      </h1>
      <p className="text-muted-foreground">
        An unexpected error occurred. Try again.
      </p>
      {digest ? (
        <p className="font-mono text-sm text-muted-foreground">
          Error ID: {digest}
        </p>
      ) : null}
      <Button onClick={() => retry()}>Try again</Button>
    </main>
  );
}

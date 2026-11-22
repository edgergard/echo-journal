"use client"; // Error boundaries must be Client Components.

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function SettingsError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col items-start gap-4">
      <h1 className="mb-6 font-heading text-4xl font-medium tracking-tight">
        Settings
      </h1>
      <p role="alert" className="text-lg">
        {"Couldn't load your settings."}
      </p>
      <Button
        type="button"
        size="lg"
        className="h-11 px-5 text-base"
        onClick={() => retry()}
      >
        Try again
      </Button>
    </div>
  );
}

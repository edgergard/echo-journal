"use client";

import { RotateCcw } from "lucide-react";
import { unstable_rethrow } from "next/navigation";
import { useId, useState, useTransition } from "react";

import { PendingLabel } from "@/components/auth/pending-label";
import { Button } from "@/components/ui/button";

import type { SettingsAction } from "./settings-types";

type Outcome = "idle" | "done" | "failed";

/** "Reset demo data" (demo account only); the result is a role=status line. */
export function ResetDemoButton({ action }: { action: SettingsAction }) {
  const [pending, startTransition] = useTransition();
  const [outcome, setOutcome] = useState<Outcome>("idle");
  const labelId = useId();

  const reset = () => {
    setOutcome("idle");
    startTransition(async () => {
      try {
        const result = await action();
        setOutcome(result.ok ? "done" : "failed");
      } catch (error) {
        // Let Next.js handle a redirect() from the action.
        unstable_rethrow(error);
        console.error("[auth] resetDemo failed", error);
        setOutcome("failed");
      }
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="outline"
        size="lg"
        onClick={reset}
        disabled={pending}
        focusableWhenDisabled
        aria-busy={pending || undefined}
        aria-labelledby={labelId}
        className="h-11 self-start px-5 text-base data-disabled:opacity-70"
      >
        {pending ? null : <RotateCcw aria-hidden="true" />}
        <PendingLabel id={labelId} pending={pending}>
          {pending ? "Resetting…" : "Reset demo data"}
        </PendingLabel>
      </Button>
      <p
        role="status"
        className={
          outcome === "failed"
            ? "text-sm text-destructive"
            : "text-sm text-muted-foreground"
        }
      >
        {outcome === "done" ? "Demo data restored." : null}
        {outcome === "failed"
          ? "Couldn't reset the demo data. Try again."
          : null}
      </p>
    </div>
  );
}

"use client";

import { LogOut } from "lucide-react";
import { unstable_rethrow } from "next/navigation";
import { useId, useState, useTransition } from "react";

import { PendingLabel } from "@/components/auth/pending-label";
import { Button } from "@/components/ui/button";

import type { SettingsAction } from "./settings-types";

/** "Sign out": on success the action redirects to the landing page. */
export function SignOutButton({ action }: { action: SettingsAction }) {
  const [pending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);
  const labelId = useId();

  const signOut = () => {
    setFailed(false);
    startTransition(async () => {
      try {
        const result = await action();
        if (!result.ok) setFailed(true);
      } catch (error) {
        // Let Next.js handle a redirect() from the action.
        unstable_rethrow(error);
        console.error("[auth] signOut failed", error);
        setFailed(true);
      }
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        size="lg"
        onClick={signOut}
        disabled={pending}
        focusableWhenDisabled
        aria-busy={pending || undefined}
        aria-labelledby={labelId}
        className="h-11 self-start px-5 text-base data-disabled:opacity-70"
      >
        {pending ? null : <LogOut aria-hidden="true" />}
        <PendingLabel id={labelId} pending={pending}>
          {pending ? "Signing out…" : "Sign out"}
        </PendingLabel>
      </Button>
      {failed ? (
        <p role="alert" className="text-sm text-destructive">
          {"Couldn't sign you out. Try again."}
        </p>
      ) : null}
    </div>
  );
}

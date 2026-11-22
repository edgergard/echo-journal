"use client";

import { useActionState, useId } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import {
  AUTH_COPY,
  type DemoSignIn,
  type DemoSignInState,
} from "./auth-schema";
import { PendingLabel } from "./pending-label";

interface DemoSignInButtonProps {
  action: DemoSignIn;
  /** Where to go after signing in (same-origin path); defaults to the journal. */
  next?: string;
  /** "primary" on the landing page, "link" under the sign-in form. */
  appearance?: "primary" | "link";
  children: React.ReactNode;
  className?: string;
}

/** Signs in to the demo account (design.md: landing, sign-in). */
export function DemoSignInButton({
  action,
  next,
  appearance = "primary",
  children,
  className,
}: DemoSignInButtonProps) {
  const [state, formAction, pending] = useActionState<
    DemoSignInState,
    FormData
  >(action, { status: "idle" });
  const labelId = useId();
  const errorId = useId();
  const failed = state.status === "error" && !pending;

  return (
    <form action={formAction} className={cn("flex flex-col gap-3", className)}>
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <Button
        type="submit"
        variant={appearance === "link" ? "link" : "default"}
        size="lg"
        disabled={pending}
        focusableWhenDisabled
        aria-busy={pending || undefined}
        aria-labelledby={labelId}
        aria-describedby={failed ? errorId : undefined}
        className={cn(
          "data-disabled:opacity-70",
          appearance === "link"
            ? "h-11 self-start px-0 text-base underline underline-offset-4 hover:decoration-2"
            : "h-12 self-start px-6 text-base",
        )}
      >
        <PendingLabel id={labelId} pending={pending}>
          {children}
        </PendingLabel>
      </Button>
      {failed ? (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {AUTH_COPY.demoFailed}
        </p>
      ) : null}
    </form>
  );
}

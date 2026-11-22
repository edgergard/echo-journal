"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import {
  AUTH_COPY,
  EmailSignInSchema,
  type DemoSignIn,
  type EmailSignInInput,
  type EmailSignInValues,
  type SendEmailLink,
  type SignInWithGitHub,
} from "./auth-schema";
import { DemoSignInButton } from "./demo-sign-in-button";
import { GitHubMark } from "./github-mark";
import { PendingLabel } from "./pending-label";

interface AuthFormProps {
  /** Same-origin path to open after signing in. */
  next: string;
  sendEmailLink: SendEmailLink;
  signInWithGitHub: SignInWithGitHub;
  signInDemo: DemoSignIn;
  /** /auth/callback could not finish the sign-in. */
  callbackFailed?: boolean;
}

/** Sign-in: magic link, GitHub, or the demo (design.md: sign-in, AuthForm). */
export function AuthForm({
  next,
  sendEmailLink,
  signInWithGitHub,
  signInDemo,
  callbackFailed = false,
}: AuthFormProps) {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(
    callbackFailed ? AUTH_COPY.callbackFailed : null,
  );
  const [gitHubPending, startGitHub] = useTransition();
  const refocusEmail = useRef(false);

  const emailId = useId();
  const emailErrorId = useId();
  const submitLabelId = useId();
  const gitHubLabelId = useId();

  const {
    register,
    handleSubmit,
    setError: setFieldError,
    setFocus,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EmailSignInInput, unknown, EmailSignInValues>({
    resolver: zodResolver(EmailSignInSchema),
    defaultValues: { email: "" },
  });

  useEffect(() => {
    if (sentTo === null && refocusEmail.current) {
      refocusEmail.current = false;
      setFocus("email");
    }
  }, [sentTo, setFocus]);

  const onSubmit = handleSubmit(async ({ email }) => {
    setNotice(null);
    setError(null);
    try {
      const result = await sendEmailLink({ email, next });
      if (result.status === "sent") setSentTo(result.email);
      else if (result.status === "invalid") {
        setFieldError(
          "email",
          { message: "Enter a valid email address." },
          { shouldFocus: true },
        );
      } else if (result.status === "not-configured") {
        setNotice(AUTH_COPY.notConfigured);
      } else setError(AUTH_COPY.sendFailed);
    } catch {
      setError(AUTH_COPY.sendFailed);
    }
  });

  const onGitHub = () => {
    setNotice(null);
    setError(null);
    startGitHub(async () => {
      try {
        // On success the action redirects to GitHub and never resolves here.
        const result = await signInWithGitHub({ next });
        if (result.status === "not-configured") {
          setNotice(AUTH_COPY.notConfigured);
        } else setError(AUTH_COPY.gitHubFailed);
      } catch {
        setError(AUTH_COPY.gitHubFailed);
      }
    });
  };

  const chooseDifferentEmail = () => {
    refocusEmail.current = true;
    reset({ email: "" });
    setSentTo(null);
  };

  const emailError = errors.email?.message;
  const busy = isSubmitting || gitHubPending;

  return (
    <div className="flex flex-col gap-6">
      {/* Always mounted, so screen readers announce its updates. */}
      <div
        role="status"
        className={cn(
          "rounded-md border bg-card p-4 text-pretty text-card-foreground",
          sentTo !== null && "p-5 font-serif text-lg leading-relaxed",
          // Out of the layout but still in the accessibility tree when empty.
          sentTo === null && !notice && "sr-only",
        )}
      >
        {sentTo !== null ? (
          <>
            Check your inbox — we sent a link to{" "}
            <strong className="font-semibold break-all">{sentTo}</strong>.
          </>
        ) : (
          notice
        )}
      </div>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {sentTo !== null ? (
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="h-11 self-start px-4 text-base"
          onClick={chooseDifferentEmail}
        >
          Use a different email
        </Button>
      ) : (
        <>
          <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor={emailId} className="text-base">
                Email
              </Label>
              <Input
                id={emailId}
                type="email"
                autoComplete="email"
                inputMode="email"
                spellCheck={false}
                placeholder="you@example.com"
                aria-invalid={emailError ? true : undefined}
                aria-describedby={emailError ? emailErrorId : undefined}
                readOnly={isSubmitting}
                className="h-11 bg-card px-3 text-base md:text-base"
                {...register("email")}
              />
              {emailError ? (
                <p id={emailErrorId} className="text-sm text-destructive">
                  {emailError}
                </p>
              ) : null}
            </div>
            <Button
              type="submit"
              size="lg"
              disabled={busy}
              focusableWhenDisabled
              aria-busy={isSubmitting || undefined}
              aria-labelledby={submitLabelId}
              className="h-11 text-base data-disabled:opacity-70"
            >
              <PendingLabel id={submitLabelId} pending={isSubmitting}>
                {isSubmitting ? "Sending…" : "Email me a link"}
              </PendingLabel>
            </Button>
          </form>

          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span aria-hidden="true" className="h-px flex-1 bg-border" />
            or
            <span aria-hidden="true" className="h-px flex-1 bg-border" />
          </div>

          <Button
            type="button"
            variant="outline"
            size="lg"
            disabled={busy}
            focusableWhenDisabled
            aria-busy={gitHubPending || undefined}
            aria-labelledby={gitHubLabelId}
            onClick={onGitHub}
            className="h-11 text-base data-disabled:opacity-70"
          >
            {gitHubPending ? null : <GitHubMark className="size-4" />}
            <PendingLabel id={gitHubLabelId} pending={gitHubPending}>
              Continue with GitHub
            </PendingLabel>
          </Button>

          <DemoSignInButton action={signInDemo} next={next} appearance="link">
            Try the demo instead
          </DemoSignInButton>
        </>
      )}
    </div>
  );
}

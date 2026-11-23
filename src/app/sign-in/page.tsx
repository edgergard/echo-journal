import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { AuthForm } from "@/components/auth/auth-form";
import { Skeleton } from "@/components/ui/skeleton";
import { env } from "@/env";
import { routes } from "@/lib/routes";
import {
  sendEmailLinkAction,
  signInDemoAction,
  signInWithGitHubAction,
} from "@/server/auth/actions";

import { parseSignInParams } from "./sign-in-params";

export const metadata: Metadata = { title: "Sign in" };

async function SignInForm({
  searchParams,
}: {
  searchParams: PageProps<"/sign-in">["searchParams"];
}) {
  const { next, callbackFailed } = parseSignInParams(await searchParams);
  return (
    <AuthForm
      next={next}
      callbackFailed={callbackFailed}
      emailEnabled={env.AUTH_EMAIL_ENABLED}
      sendEmailLink={sendEmailLinkAction}
      signInWithGitHub={signInWithGitHubAction}
      signInDemo={signInDemoAction}
    />
  );
}

function SignInFormSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-4">
      <Skeleton className="h-4 w-12" />
      <Skeleton className="h-11 w-full" />
      <Skeleton className="h-11 w-full" />
      <Skeleton className="mt-6 h-11 w-full" />
    </div>
  );
}

export default function SignInPage(props: PageProps<"/sign-in">) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-6 py-12 sm:py-16">
      <Link
        href={routes.landing}
        className="self-start font-heading text-2xl font-semibold text-foreground"
      >
        Echo
      </Link>
      <h1 className="font-heading text-3xl font-medium tracking-tight sm:text-4xl">
        Sign in to Echo
      </h1>
      <Suspense fallback={<SignInFormSkeleton />}>
        <SignInForm searchParams={props.searchParams} />
      </Suspense>
      <p className="text-sm text-muted-foreground">
        By signing in you agree to the{" "}
        <Link
          href={routes.terms}
          className="font-medium text-primary underline underline-offset-4"
        >
          Terms
        </Link>{" "}
        and{" "}
        <Link
          href={routes.privacy}
          className="font-medium text-primary underline underline-offset-4"
        >
          Privacy
        </Link>{" "}
        notes.
      </p>
    </main>
  );
}

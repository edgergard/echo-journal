import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { AuthForm } from "@/components/auth/auth-form";
import { Skeleton } from "@/components/ui/skeleton";
import { routes, safeNextPath } from "@/lib/routes";
import {
  sendEmailLinkAction,
  signInDemoAction,
  signInWithGitHubAction,
} from "@/server/auth/actions";

export const metadata: Metadata = { title: "Sign in" };

/** /auth/callback adds `?error=callback` when it can't finish a sign-in. */
const CALLBACK_ERROR = "callback";

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

async function SignInForm({
  searchParams,
}: {
  searchParams: PageProps<"/sign-in">["searchParams"];
}) {
  const params = await searchParams;
  return (
    <AuthForm
      next={safeNextPath(firstValue(params.next))}
      callbackFailed={firstValue(params.error) === CALLBACK_ERROR}
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
    </main>
  );
}

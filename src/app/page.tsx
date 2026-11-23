import Link from "next/link";

import { DemoSignInButton } from "@/components/auth/demo-sign-in-button";
import { LandingPreview } from "@/components/landing/landing-preview";
import { buttonVariants } from "@/components/ui/button";
import { env } from "@/env";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { signInDemoAction } from "@/server/auth/actions";

/** Landing (design.md: landing). Signed-in visitors are sent to /journal by the proxy. */
export default function LandingPage() {
  return (
    <>
      <header className="mx-auto w-full max-w-5xl px-6 pt-6">
        <p className="font-heading text-2xl font-semibold">Echo</p>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-14 px-6 py-12 sm:gap-16 sm:py-20">
        <div className="flex max-w-2xl flex-col gap-6">
          <h1 className="font-heading text-4xl font-medium tracking-tight text-balance sm:text-5xl lg:text-6xl">
            A journal that remembers.
          </h1>
          <p className="text-lg text-pretty text-muted-foreground sm:text-xl">
            {
              "Write a few lines. Echo replies — and points back to the days you've already written about."
            }
          </p>
          <div className="flex flex-wrap items-start gap-3 pt-2">
            <DemoSignInButton action={signInDemoAction}>
              Try the demo
            </DemoSignInButton>
            <Link
              href={routes.signIn()}
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "h-12 px-6 text-base",
              )}
            >
              Sign in
            </Link>
          </div>
        </div>

        <LandingPreview />
      </main>

      <footer className="border-t">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-6 py-6 text-sm text-muted-foreground">
          <p>Not a therapist. Not medical advice.</p>
          <nav aria-label="Footer" className="flex flex-wrap gap-x-5">
            <Link
              href={routes.privacy}
              className="py-2 font-medium text-primary underline-offset-4 hover:underline"
            >
              Privacy
            </Link>
            <Link
              href={routes.terms}
              className="py-2 font-medium text-primary underline-offset-4 hover:underline"
            >
              Terms
            </Link>
            <a
              href={env.NEXT_PUBLIC_REPO_URL}
              className="py-2 font-medium text-primary underline-offset-4 hover:underline"
            >
              Source code on GitHub
            </a>
          </nav>
        </div>
      </footer>
    </>
  );
}

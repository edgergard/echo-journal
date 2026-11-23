import Link from "next/link";

import { routes } from "@/lib/routes";

/** Shared frame for the public legal pages (privacy, terms). */
export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12 sm:py-16">
      <Link
        href={routes.landing}
        className="font-heading text-2xl font-semibold text-foreground"
      >
        Echo
      </Link>
      <h1 className="mt-10 font-heading text-4xl font-medium tracking-tight">
        {title}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated {updated}. Draft — not legal advice; reviewed by the
        operator before publishing.
      </p>
      <div className="mt-10 flex max-w-[68ch] flex-col gap-6 leading-relaxed [&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 [&_h2]:mt-4 [&_h2]:font-heading [&_h2]:text-2xl [&_h2]:font-medium [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6">
        {children}
      </div>
    </main>
  );
}

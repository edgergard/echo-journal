"use client";

import { PenLine } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

const NAV = [
  { href: routes.journal, label: "Journal" },
  { href: routes.week(), label: "Week" },
  { href: routes.settings, label: "Settings" },
] as const;

/** The signed-in app header (design.md: AppHeader). */
export function AppHeader() {
  const pathname = usePathname();
  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-3 px-6 py-4">
        <Link
          href={routes.journal}
          className="font-heading text-2xl font-semibold text-foreground"
        >
          Echo
        </Link>
        <nav aria-label="Main" className="flex grow flex-wrap gap-1">
          {NAV.map((item) => {
            const current =
              pathname === item.href ||
              (item.href === routes.journal &&
                pathname.startsWith(`${routes.journal}/`) &&
                pathname !== routes.newEntry);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "rounded-md px-3.5 py-2.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  current &&
                    "bg-secondary font-medium text-secondary-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <Link href={routes.newEntry} className={buttonVariants({ size: "lg" })}>
          <PenLine aria-hidden="true" />
          New entry
        </Link>
      </div>
    </header>
  );
}

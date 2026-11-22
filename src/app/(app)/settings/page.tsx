import type { Metadata } from "next";
import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/lib/routes";
import { requireSession } from "@/server/auth/require-session";

export const metadata: Metadata = { title: "Settings" };

/** Stub — stream 1-auth builds it (design.md: settings). */
async function SettingsContent() {
  const session = await requireSession(routes.settings);
  return (
    <p className="text-muted-foreground">
      {session.isDemo ? "Demo account" : session.email}
    </p>
  );
}

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-8 font-heading text-4xl font-medium">Settings</h1>
      <Suspense fallback={<Skeleton className="h-40 w-full" />}>
        <SettingsContent />
      </Suspense>
    </div>
  );
}

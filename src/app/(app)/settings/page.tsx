import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

import { SettingsView } from "@/components/settings/settings-view";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/lib/routes";
import {
  deleteAccountAction,
  resetDemoAction,
  signOutAction,
} from "@/server/auth/actions";
import { requireSession } from "@/server/auth/require-session";
import { getBackend } from "@/server/backend";

export const metadata: Metadata = { title: "Settings" };

async function SettingsContent() {
  // "Replies left today" depends on the current UTC day: request time only.
  await connection();
  const session = await requireSession(routes.settings);
  const usage = getBackend().usage;
  const repliesLeft = await usage.remaining(session.userId);
  return (
    <SettingsView
      session={session}
      repliesLeft={repliesLeft}
      dailyLimit={usage.limit()}
      actions={{
        signOut: signOutAction,
        deleteAccount: deleteAccountAction,
        resetDemo: resetDemoAction,
      }}
    />
  );
}

function SettingsSkeleton() {
  return (
    <div aria-busy="true" className="flex max-w-2xl flex-col gap-10">
      <span role="status" className="sr-only">
        Loading your settings…
      </span>
      {[0, 1, 2].map((section) => (
        <div key={section} aria-hidden="true" className="flex flex-col gap-3">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-5 w-full max-w-md" />
          <Skeleton className="h-11 w-32" />
        </div>
      ))}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-10 font-heading text-4xl font-medium tracking-tight">
        Settings
      </h1>
      <Suspense fallback={<SettingsSkeleton />}>
        <SettingsContent />
      </Suspense>
    </div>
  );
}

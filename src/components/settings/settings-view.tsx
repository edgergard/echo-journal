import Link from "next/link";

import type { Session } from "@/contracts/session";
import { routes } from "@/lib/routes";

import { DeleteAccountDialog } from "./delete-account-dialog";
import { ResetDemoButton } from "./reset-demo-button";
import type { SettingsActions } from "./settings-types";
import { SignOutButton } from "./sign-out-button";

export interface SettingsViewProps {
  session: Session;
  repliesLeft: number;
  dailyLimit: number;
  actions: SettingsActions;
}

const HELPLINE_URL = "https://findahelpline.com";

function SettingsSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      aria-labelledby={id}
      className="flex flex-col gap-4 border-t py-8 first:border-t-0 first:pt-0"
    >
      <h2 id={id} className="font-heading text-xl font-medium">
        {title}
      </h2>
      {children}
    </section>
  );
}

/** Settings content (design.md: settings). The page adds the h1. */
export function SettingsView({
  session,
  repliesLeft,
  dailyLimit,
  actions,
}: SettingsViewProps) {
  return (
    <div className="flex max-w-2xl flex-col">
      <SettingsSection id="settings-account" title="Account">
        {session.isDemo ? (
          <div className="flex flex-col gap-1">
            <p className="text-lg font-medium">Demo account</p>
            <p className="text-muted-foreground">
              {
                "Everyone who tries the demo shares this account, so don't write anything private here."
              }
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            <p className="text-muted-foreground">Signed in as</p>
            <p className="text-lg font-medium break-all">
              {session.email ?? "your GitHub account"}
            </p>
          </div>
        )}
        <SignOutButton action={actions.signOut} />
      </SettingsSection>

      <SettingsSection id="settings-replies" title="Daily replies">
        <p className="text-lg">
          Replies left today: {repliesLeft} of {dailyLimit}
        </p>
        <p className="text-muted-foreground">
          Replies and weekly summaries share this limit. It resets at midnight
          UTC.
        </p>
      </SettingsSection>

      <SettingsSection id="settings-about" title="About Echo">
        <p className="max-w-[68ch] leading-relaxed">
          {
            "Echo is an AI companion for your journal: it replies to each entry and points back to what you've written before. Echo isn't a therapist, and its replies aren't medical advice."
          }
        </p>
        <p className="max-w-[68ch] leading-relaxed">
          {
            "If you're in crisis, contact local emergency services or find a helpline at "
          }
          <a
            href={HELPLINE_URL}
            className="font-medium text-primary underline underline-offset-4 hover:decoration-2"
          >
            findahelpline.com
          </a>
          .
        </p>
        <p className="flex flex-wrap gap-x-5">
          <Link
            href={routes.privacy}
            className="font-medium text-primary underline underline-offset-4 hover:decoration-2"
          >
            Privacy
          </Link>
          <Link
            href={routes.terms}
            className="font-medium text-primary underline underline-offset-4 hover:decoration-2"
          >
            Terms
          </Link>
        </p>
      </SettingsSection>

      {session.isDemo ? (
        <SettingsSection id="settings-demo" title="Demo data">
          <p className="text-muted-foreground">
            {"Puts the demo entries and Echo's replies back the way they were."}
          </p>
          <ResetDemoButton action={actions.resetDemo} />
        </SettingsSection>
      ) : (
        <SettingsSection id="settings-delete" title="Delete account">
          <p className="text-muted-foreground">
            {"Removes your account, your entries and Echo's replies for good."}
          </p>
          <DeleteAccountDialog action={actions.deleteAccount} />
        </SettingsSection>
      )}
    </div>
  );
}

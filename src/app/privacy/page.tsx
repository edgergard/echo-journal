import type { Metadata } from "next";

import { LegalPage } from "@/components/legal/legal-page";
import { env } from "@/env";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  const issues = `${env.NEXT_PUBLIC_REPO_URL}/issues`;
  return (
    <LegalPage title="Privacy" updated="November 23, 2026">
      <p>
        Echo Journal is a non-commercial portfolio project run by Oleksandr
        Bryksin, a private individual in Ukraine. This page explains what the
        app stores, where it goes and how to delete it.
      </p>

      <h2>What Echo stores</h2>
      <ul>
        <li>
          Your account: your email address, and your name and avatar if you sign
          in with GitHub.
        </li>
        <li>
          Your journal: entry text, mood, dates, Echo&apos;s replies and the
          past entries a reply refers to.
        </li>
        <li>
          Memory: a numeric representation (embedding) of each entry, used only
          to find your similar past entries.
        </li>
        <li>A count of AI requests per day, to enforce the daily limit.</li>
      </ul>

      <h2>Where it goes</h2>
      <ul>
        <li>
          <strong>Supabase</strong> stores your account and journal in a
          database where each account can only read its own rows.
        </li>
        <li>
          <strong>OpenRouter</strong> passes text to an AI model to write
          Echo&apos;s reply, the weekly summary and the embeddings: the entry
          (up to 2,000 characters), short quotes from your past entries, and for
          the summary up to 600 characters per entry of that week. Requests are
          restricted to model providers that do not collect or train on the
          data.
        </li>
        <li>
          <strong>Vercel</strong> hosts the site and keeps standard request logs
          (such as IP address) for operating it.
        </li>
      </ul>
      <p>
        There is no analytics, no advertising and no tracking. The only cookies
        keep you signed in.
      </p>

      <h2>How long, and deletion</h2>
      <p>
        Your data stays until you delete it. Deleting an entry removes it, its
        reply and its embedding. Settings → Delete account removes your account
        and everything in it. The shared demo account can be reset at any time;
        don&apos;t write anything personal there.
      </p>

      <h2>Not a medical service</h2>
      <p>
        Echo is a writing companion, not therapy or medical advice. If you are
        in crisis, contact local emergency services or find a helpline at{" "}
        <a href="https://findahelpline.com">findahelpline.com</a>.
      </p>

      <h2>Contact</h2>
      <p>
        Questions or requests: open an issue at{" "}
        <a href={issues}>the project&apos;s GitHub repository</a> (please
        don&apos;t include personal details there — I&apos;ll reply with a
        private way to reach me).
      </p>
    </LegalPage>
  );
}

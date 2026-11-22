"use server";

import "server-only";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import * as z from "zod";

import {
  EmailSignInSchema,
  type DemoSignInState,
  type EmailLinkResult,
  type GitHubSignInResult,
} from "@/components/auth/auth-schema";
import type { SettingsActionResult } from "@/components/settings/settings-types";
import { routes, safeNextPath } from "@/lib/routes";
import { getBackend } from "@/server/backend";

import { logAuthError } from "./log";

const NextInputSchema = z.object({ next: z.string().optional() });
const EmailLinkInputSchema = EmailSignInSchema.extend(NextInputSchema.shape);

const FAILED: SettingsActionResult = { ok: false };

/** "Try the demo": signs in to the demo account and opens the journal. */
export async function signInDemoAction(
  _state: DemoSignInState,
  formData: FormData,
): Promise<DemoSignInState> {
  const rawNext = formData.get("next");
  const next = safeNextPath(typeof rawNext === "string" ? rawNext : null);
  try {
    const result = await getBackend().auth.signInDemo();
    if (!result.ok) return { status: "error" };
  } catch (error) {
    logAuthError("signInDemo", error);
    return { status: "error" };
  }
  redirect(next);
}

/** "Email me a link": sends a magic link that lands on /auth/callback. */
export async function sendEmailLinkAction(
  input: unknown,
): Promise<EmailLinkResult> {
  const parsed = EmailLinkInputSchema.safeParse(input);
  if (!parsed.success) return { status: "invalid" };
  const { email, next } = parsed.data;
  try {
    const result = await getBackend().auth.signInWithEmail(
      email,
      safeNextPath(next),
    );
    if (result.ok) return { status: "sent", email };
    return result.reason === "not-configured"
      ? { status: "not-configured" }
      : { status: "error" };
  } catch (error) {
    logAuthError("sendEmailLink", error);
    return { status: "error" };
  }
}

/** "Continue with GitHub": redirects to GitHub through Supabase OAuth. */
export async function signInWithGitHubAction(
  input: unknown,
): Promise<GitHubSignInResult> {
  const parsed = NextInputSchema.safeParse(input);
  const next = safeNextPath(parsed.success ? parsed.data.next : null);
  let url: string;
  try {
    const result = await getBackend().auth.signInWithGitHub(next);
    if (!result.ok) {
      return result.reason === "not-configured"
        ? { status: "not-configured" }
        : { status: "error" };
    }
    url = result.url;
  } catch (error) {
    logAuthError("signInWithGitHub", error);
    return { status: "error" };
  }
  redirect(url);
}

export async function signOutAction(): Promise<SettingsActionResult> {
  try {
    await getBackend().auth.signOut();
  } catch (error) {
    logAuthError("signOut", error);
    return FAILED;
  }
  redirect(routes.landing);
}

/** Deletes the signed-in (non-demo) account with all its data. */
export async function deleteAccountAction(): Promise<SettingsActionResult> {
  const auth = getBackend().auth;
  try {
    const session = await auth.getSession();
    if (!session || session.isDemo) return FAILED;
    const result = await auth.deleteAccount(session);
    if (!result.ok) return FAILED;
  } catch (error) {
    logAuthError("deleteAccount", error);
    return FAILED;
  }
  redirect(routes.landing);
}

/** Restores the demo account's seeded entries and replies. */
export async function resetDemoAction(): Promise<SettingsActionResult> {
  const auth = getBackend().auth;
  try {
    const session = await auth.getSession();
    if (!session?.isDemo) return FAILED;
    const result = await auth.resetDemo(session);
    if (!result.ok) return FAILED;
  } catch (error) {
    logAuthError("resetDemo", error);
    return FAILED;
  }
  // Re-render the page so "Replies left today" shows the reset count.
  refresh();
  return { ok: true };
}

import "server-only";

import { cookies } from "next/headers";

import type { AuthResult, AuthService } from "@/contracts/backend";
import type { Session } from "@/contracts/session";
import { env } from "@/env";
import { routes, safeNextPath } from "@/lib/routes";
import { buildDemoSeed } from "@/server/demo/seed";

import { buildDemoRows } from "./demo-rows";
import { logAuthError } from "./log";
import { getRequestOrigin } from "./origin";
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from "./supabase-client";

const OK: AuthResult = { ok: true };
const NOT_CONFIGURED: AuthResult = { ok: false, reason: "not-configured" };
const INVALID: AuthResult = { ok: false, reason: "invalid" };
const FAILED: AuthResult = { ok: false, reason: "failed" };

/** Supabase auth cookies are named `sb-<project-ref>-auth-token(.N)`. */
const AUTH_COOKIE_PREFIX = "sb-";

function isDemoEmail(email: string | null): boolean {
  const demoEmail = env.DEMO_USER_EMAIL;
  return Boolean(
    email && demoEmail && email.toLowerCase() === demoEmail.toLowerCase(),
  );
}

async function callbackUrl(next: string): Promise<string> {
  const url = new URL(routes.authCallback, await getRequestOrigin());
  url.searchParams.set("next", safeNextPath(next));
  return url.toString();
}

/** Real-mode auth on Supabase (`@supabase/ssr`, cookie session). */
export class SupabaseAuthService implements AuthService {
  async getSession(): Promise<Session | null> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.getClaims();
    if (error || !data) return null;
    const { sub, email: rawEmail } = data.claims;
    if (typeof sub !== "string" || !sub) return null;
    const email =
      typeof rawEmail === "string" && rawEmail.length > 0 ? rawEmail : null;
    return { userId: sub, email, isDemo: isDemoEmail(email) };
  }

  async signInDemo(): Promise<AuthResult> {
    const email = env.DEMO_USER_EMAIL;
    const password = env.DEMO_USER_PASSWORD;
    if (!email || !password) return NOT_CONFIGURED;
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (!error) return OK;
    logAuthError("signInDemo", error);
    return FAILED;
  }

  async signInWithEmail(email: string, next: string): Promise<AuthResult> {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: await callbackUrl(next) },
    });
    if (!error) return OK;
    logAuthError("signInWithEmail", error);
    return error.status === 400 || error.status === 422 ? INVALID : FAILED;
  }

  async signInWithGitHub(
    next: string,
  ): Promise<{ ok: true; url: string } | { ok: false; reason: string }> {
    const supabase = await createSupabaseServerClient();
    // PKCE: the code verifier is stored in a cookie for /auth/callback.
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: await callbackUrl(next),
        skipBrowserRedirect: true,
      },
    });
    if (error || !data.url) {
      logAuthError("signInWithGitHub", error ?? new Error("No provider URL"));
      return { ok: false, reason: "failed" };
    }
    return { ok: true, url: data.url };
  }

  async exchangeCode(code: string): Promise<AuthResult> {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return OK;
    logAuthError("exchangeCode", error);
    return FAILED;
  }

  async signOut(): Promise<void> {
    const supabase = await createSupabaseServerClient();
    // "local": the demo account is shared, so never revoke other visitors' sessions.
    const { error } = await supabase.auth.signOut({ scope: "local" });
    // The local session is cleared even when revoking the token fails.
    if (error) logAuthError("signOut", error);
    // Belt and braces: drop any auth cookie the client left behind.
    const store = await cookies();
    for (const cookie of store.getAll()) {
      if (cookie.name.startsWith(AUTH_COOKIE_PREFIX)) store.delete(cookie.name);
    }
  }

  async deleteAccount(session: Session): Promise<AuthResult> {
    if (session.isDemo) return INVALID;
    if (!env.SUPABASE_SERVICE_ROLE_KEY) return NOT_CONFIGURED;
    const admin = createSupabaseAdminClient();
    // Every table references auth.users on delete cascade.
    const { error } = await admin.auth.admin.deleteUser(session.userId);
    if (error) {
      logAuthError("deleteAccount deleteUser", error);
      return FAILED;
    }
    try {
      await this.signOut();
    } catch (signOutError) {
      // The account is gone either way; stale cookies fail validation.
      logAuthError("deleteAccount signOut", signOutError);
    }
    return OK;
  }

  async resetDemo(session: Session): Promise<AuthResult> {
    if (!session.isDemo) return INVALID;
    if (!env.SUPABASE_SERVICE_ROLE_KEY) return NOT_CONFIGURED;
    const admin = createSupabaseAdminClient();
    const userId = session.userId;
    const rows = buildDemoRows(buildDemoSeed(), userId, () =>
      crypto.randomUUID(),
    );

    // Deleting entries cascades to reflections and embeddings.
    const cleared = await Promise.all([
      admin.from("entries").delete().eq("user_id", userId),
      admin.from("ai_usage").delete().eq("user_id", userId),
    ]);
    const clearError = cleared.find((result) => result.error)?.error;
    if (clearError) {
      logAuthError("resetDemo clear", clearError);
      return FAILED;
    }

    const entries = await admin.from("entries").insert(rows.entries);
    if (entries.error) {
      logAuthError("resetDemo insert entries", entries.error);
      return FAILED;
    }
    const reflections = await admin
      .from("reflections")
      .insert(rows.reflections);
    if (reflections.error) {
      logAuthError("resetDemo insert reflections", reflections.error);
      return FAILED;
    }
    return OK;
  }
}

import "server-only";

import { cookies } from "next/headers";

import type { AuthResult, AuthService } from "@/contracts/backend";
import { DEMO_USER_ID, type Session } from "@/contracts/session";
import { resetDemoStore } from "@/server/demo/store";

export const DEMO_SESSION_COOKIE = "echo_demo_session";

const NOT_CONFIGURED: AuthResult = { ok: false, reason: "not-configured" };

/**
 * Demo-mode auth: a cookie marks the visitor as the demo user.
 * Email and GitHub sign-in are not available without Supabase.
 */
export class MemoryAuthService implements AuthService {
  async getSession(): Promise<Session | null> {
    const store = await cookies();
    if (store.get(DEMO_SESSION_COOKIE)?.value !== "1") return null;
    return { userId: DEMO_USER_ID, email: null, isDemo: true };
  }

  async signInDemo(): Promise<AuthResult> {
    const store = await cookies();
    store.set(DEMO_SESSION_COOKIE, "1", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
    });
    return { ok: true };
  }

  async signInWithEmail(): Promise<AuthResult> {
    return NOT_CONFIGURED;
  }

  async signInWithGitHub() {
    return { ok: false as const, reason: "not-configured" };
  }

  async exchangeCode(): Promise<AuthResult> {
    return NOT_CONFIGURED;
  }

  async signOut(): Promise<void> {
    const store = await cookies();
    store.delete(DEMO_SESSION_COOKIE);
  }

  async deleteAccount(): Promise<AuthResult> {
    return NOT_CONFIGURED;
  }

  async resetDemo(session: Session): Promise<AuthResult> {
    if (!session.isDemo) return { ok: false, reason: "invalid" };
    resetDemoStore();
    return { ok: true };
  }
}

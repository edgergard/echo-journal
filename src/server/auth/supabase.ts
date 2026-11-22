import "server-only";

import type { AuthResult, AuthService } from "@/contracts/backend";
import type { Session } from "@/contracts/session";

const TODO = "Supabase auth is not implemented yet (stream 1-auth)";

/** Real-mode auth on Supabase. Stub — implemented by stream 1-auth. */
export class SupabaseAuthService implements AuthService {
  async getSession(): Promise<Session | null> {
    throw new Error(TODO);
  }
  async signInDemo(): Promise<AuthResult> {
    throw new Error(TODO);
  }
  async signInWithEmail(): Promise<AuthResult> {
    throw new Error(TODO);
  }
  async signInWithGitHub(): Promise<
    { ok: true; url: string } | { ok: false; reason: string }
  > {
    throw new Error(TODO);
  }
  async exchangeCode(): Promise<AuthResult> {
    throw new Error(TODO);
  }
  async signOut(): Promise<void> {
    throw new Error(TODO);
  }
  async deleteAccount(): Promise<AuthResult> {
    throw new Error(TODO);
  }
  async resetDemo(): Promise<AuthResult> {
    throw new Error(TODO);
  }
}

// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DEMO_USER_ID } from "@/contracts/session";
import { getBackend } from "@/server/backend";
import { getDemoStore, resetDemoStoreForTests } from "@/server/demo/store";

import {
  deleteAccountAction,
  resetDemoAction,
  sendEmailLinkAction,
  signInDemoAction,
  signInWithGitHubAction,
  signOutAction,
} from "./actions";
import { DEMO_SESSION_COOKIE } from "./demo-cookie";

const jar = vi.hoisted(() => new Map<string, string>());
const flags = vi.hoisted(() => ({ emailEnabled: true }));

vi.mock("@/env", async (importOriginal) => {
  const real = await importOriginal<typeof import("@/env")>();
  return {
    env: new Proxy(real.env, {
      get: (target, key, receiver) =>
        key === "AUTH_EMAIL_ENABLED"
          ? flags.emailEnabled
          : Reflect.get(target, key, receiver),
    }),
  };
});

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      jar.has(name) ? { name, value: jar.get(name) } : undefined,
    getAll: () => [...jar].map(([name, value]) => ({ name, value })),
    set: (name: string, value: string) => void jar.set(name, value),
    delete: (name: string) => void jar.delete(name),
  }),
}));

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT ${url}`);
  },
}));

vi.mock("next/cache", () => ({ refresh: vi.fn() }));

const UNSAFE_NEXT = ["/\\evil.com", "//evil.com", "https://evil.com"];

describe("auth actions (demo mode)", () => {
  beforeEach(() => {
    jar.clear();
    flags.emailEnabled = true;
    resetDemoStoreForTests();
  });

  it("refuses email sign-in when AUTH_EMAIL_ENABLED is off", async () => {
    flags.emailEnabled = false;
    const email = vi.spyOn(getBackend().auth, "signInWithEmail");
    expect(
      await sendEmailLinkAction({ email: "sam@example.com", next: "/" }),
    ).toEqual({ status: "not-configured" });
    expect(email).not.toHaveBeenCalled();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each(UNSAFE_NEXT)(
    "sends the demo sign-in with next=%s to the journal",
    async (next) => {
      const form = new FormData();
      form.set("next", next);
      await expect(signInDemoAction({ status: "idle" }, form)).rejects.toThrow(
        /^REDIRECT \/journal$/,
      );
    },
  );

  it.each(UNSAFE_NEXT)(
    "passes only a safe next to email and GitHub sign-in (next=%s)",
    async (next) => {
      const auth = getBackend().auth;
      const email = vi.spyOn(auth, "signInWithEmail");
      const gitHub = vi.spyOn(auth, "signInWithGitHub");
      await sendEmailLinkAction({ email: "sam@example.com", next });
      await signInWithGitHubAction({ next });
      expect(email).toHaveBeenCalledWith("sam@example.com", "/journal");
      expect(gitHub).toHaveBeenCalledWith("/journal");
    },
  );

  it("logs a thrown error and keeps the user-facing result", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(getBackend().auth, "signInDemo").mockRejectedValue(
      new Error("store down"),
    );
    expect(await signInDemoAction({ status: "idle" }, new FormData())).toEqual({
      status: "error",
    });
    expect(log).toHaveBeenCalledWith(
      "[auth] signInDemo failed",
      expect.objectContaining({ message: "store down" }),
    );
  });

  it("signs in to the demo and redirects to a safe next path", async () => {
    const form = new FormData();
    form.set("next", "https://evil.example");
    await expect(signInDemoAction({ status: "idle" }, form)).rejects.toThrow(
      "REDIRECT /journal",
    );
    expect(jar.get(DEMO_SESSION_COOKIE)).toBe("1");

    form.set("next", "/week");
    await expect(signInDemoAction({ status: "idle" }, form)).rejects.toThrow(
      "REDIRECT /week",
    );
  });

  it("validates the email on the server and reports that email is off", async () => {
    expect(await sendEmailLinkAction({ email: "nope", next: "/" })).toEqual({
      status: "invalid",
    });
    expect(await sendEmailLinkAction("garbage")).toEqual({ status: "invalid" });
    expect(
      await sendEmailLinkAction({ email: "sam@example.com", next: "/week" }),
    ).toEqual({ status: "not-configured" });
  });

  it("reports that GitHub is off", async () => {
    expect(await signInWithGitHubAction({ next: "/journal" })).toEqual({
      status: "not-configured",
    });
  });

  it("signs out and goes to the landing page", async () => {
    jar.set(DEMO_SESSION_COOKIE, "1");
    await expect(signOutAction()).rejects.toThrow("REDIRECT /");
    expect(jar.has(DEMO_SESSION_COOKIE)).toBe(false);
  });

  it("resets demo data only for the demo session", async () => {
    expect(await resetDemoAction()).toEqual({ ok: false });

    jar.set(DEMO_SESSION_COOKIE, "1");
    getDemoStore().entries.set(DEMO_USER_ID, []);
    expect(await resetDemoAction()).toEqual({ ok: true });
    expect(getDemoStore().entries.get(DEMO_USER_ID)).toHaveLength(20);
  });

  it("never deletes the demo account", async () => {
    jar.set(DEMO_SESSION_COOKIE, "1");
    expect(await deleteAccountAction()).toEqual({ ok: false });
  });
});

// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DEMO_USER_ID } from "@/contracts/session";
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

describe("auth actions (demo mode)", () => {
  beforeEach(() => {
    jar.clear();
    resetDemoStoreForTests();
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

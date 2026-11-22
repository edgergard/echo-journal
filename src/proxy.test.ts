// @vitest-environment node
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { DEMO_SESSION_COOKIE } from "@/server/auth/demo-cookie";
import { authRedirect, isProtectedPath } from "@/server/auth/gate";

import { proxy } from "./proxy";

describe("authRedirect", () => {
  it("sends signed-out visitors of app pages to sign-in with next", () => {
    expect(
      authRedirect({ pathname: "/journal", search: "", signedIn: false }),
    ).toBe("/sign-in?next=%2Fjournal");
    expect(
      authRedirect({
        pathname: "/week",
        search: "?week=2026-11-16",
        signedIn: false,
      }),
    ).toBe("/sign-in?next=%2Fweek%3Fweek%3D2026-11-16");
    expect(
      authRedirect({ pathname: "/journal/abc", search: "", signedIn: false }),
    ).toBe("/sign-in?next=%2Fjournal%2Fabc");
    expect(
      authRedirect({ pathname: "/settings", search: "", signedIn: false }),
    ).toBe("/sign-in?next=%2Fsettings");
  });

  it("sends signed-in visitors of the landing and sign-in pages to the journal", () => {
    expect(authRedirect({ pathname: "/", search: "", signedIn: true })).toBe(
      "/journal",
    );
    expect(
      authRedirect({
        pathname: "/sign-in",
        search: "?next=%2Fweek",
        signedIn: true,
      }),
    ).toBe("/journal");
  });

  it("lets everything else through", () => {
    expect(
      authRedirect({ pathname: "/journal", search: "", signedIn: true }),
    ).toBeNull();
    expect(
      authRedirect({ pathname: "/", search: "", signedIn: false }),
    ).toBeNull();
    expect(
      authRedirect({ pathname: "/sign-in", search: "", signedIn: false }),
    ).toBeNull();
    expect(
      authRedirect({
        pathname: "/auth/callback",
        search: "?code=x",
        signedIn: false,
      }),
    ).toBeNull();
  });

  it("matches protected prefixes on segment boundaries only", () => {
    expect(isProtectedPath("/journal/new")).toBe(true);
    expect(isProtectedPath("/weekly")).toBe(false);
    expect(isProtectedPath("/settings-old")).toBe(false);
  });
});

function request(path: string, demoCookie = false) {
  const headers = new Headers();
  if (demoCookie) headers.set("cookie", `${DEMO_SESSION_COOKIE}=1`);
  return new NextRequest(new URL(path, "http://localhost:3000"), { headers });
}

describe("proxy (demo mode)", () => {
  it("redirects a signed-out visitor away from an app page", async () => {
    const response = await proxy(request("/week?week=2026-11-16"));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/sign-in?next=%2Fweek%3Fweek%3D2026-11-16",
    );
  });

  it("redirects a demo session from the landing page to the journal", async () => {
    const response = await proxy(request("/", true));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/journal",
    );
  });

  it("lets a demo session open app pages", async () => {
    const response = await proxy(request("/settings", true));
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("ignores a demo cookie with an unexpected value", async () => {
    const forged = new NextRequest(new URL("/journal", "http://localhost"), {
      headers: { cookie: `${DEMO_SESSION_COOKIE}=yes` },
    });
    const response = await proxy(forged);
    expect(response.headers.get("location")).toBe(
      "http://localhost/sign-in?next=%2Fjournal",
    );
  });
});

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { DemoSignIn } from "@/components/auth/auth-schema";

import LandingPage from "./page";

const signInDemoAction = vi.hoisted(() =>
  vi.fn<DemoSignIn>(async () => ({ status: "error" })),
);

vi.mock("@/server/auth/actions", () => ({ signInDemoAction }));

describe("LandingPage", () => {
  it("renders the hero, the example and the footer", () => {
    render(<LandingPage />);

    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent("A journal that remembers.");
    expect(
      screen.getByRole("button", { name: "Try the demo" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/sign-in",
    );

    const preview = screen.getByRole("region", {
      name: "Example entry and reply",
    });
    expect(preview).toHaveTextContent("Recalled from Nov 15");

    expect(
      screen.getByText("Not a therapist. Not medical advice."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Source code on GitHub" }),
    ).toHaveAttribute("href", "https://github.com/edgergard/echo-journal");
  });

  it("shows an error when the demo can't open", async () => {
    render(<LandingPage />);
    fireEvent.click(screen.getByRole("button", { name: "Try the demo" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Couldn't open the demo. Try again in a moment.",
    );
    expect(signInDemoAction).toHaveBeenCalledOnce();
  });
});

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DEMO_USER_ID, type Session } from "@/contracts/session";
import { resetDemoStoreForTests } from "@/server/demo/store";
import { MemoryUsageLimiter } from "@/server/usage/memory";

import type { SettingsAction, SettingsActions } from "./settings-types";
import { SettingsView } from "./settings-view";

const demoSession: Session = {
  userId: DEMO_USER_ID,
  email: null,
  isDemo: true,
};
const realSession: Session = {
  userId: "user-1",
  email: "sam@example.com",
  isDemo: false,
};

function actions(overrides: Partial<SettingsActions> = {}): SettingsActions {
  const ok: SettingsAction = async () => ({ ok: true });
  return {
    signOut: vi.fn(ok),
    deleteAccount: vi.fn(ok),
    resetDemo: vi.fn(ok),
    ...overrides,
  };
}

/** Builds the view's props the way the settings page does. */
async function renderSettings(
  session: Session,
  usage: MemoryUsageLimiter,
  settingsActions = actions(),
) {
  render(
    <SettingsView
      session={session}
      repliesLeft={await usage.remaining(session.userId)}
      dailyLimit={usage.limit()}
      actions={settingsActions}
    />,
  );
  return settingsActions;
}

describe("SettingsView", () => {
  beforeEach(() => {
    resetDemoStoreForTests();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the demo account with reset and without delete", async () => {
    const usage = new MemoryUsageLimiter(10);
    await usage.consume(DEMO_USER_ID);
    await usage.consume(DEMO_USER_ID);
    await renderSettings(demoSession, usage);

    expect(screen.getByText("Demo account")).toBeInTheDocument();
    expect(screen.getByText("Replies left today: 8 of 10")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Reset demo data" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Delete account" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Sign out" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /If you're in crisis, contact local emergency services or find a helpline at/,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "findahelpline.com" }),
    ).toHaveAttribute("href", "https://findahelpline.com");
  });

  it("renders a real account with its email and delete, without reset", async () => {
    await renderSettings(realSession, new MemoryUsageLimiter(10));

    expect(screen.getByText("sam@example.com")).toBeInTheDocument();
    expect(screen.queryByText("Demo account")).not.toBeInTheDocument();
    expect(
      screen.getByText("Replies left today: 10 of 10"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Delete account" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Reset demo data" }),
    ).not.toBeInTheDocument();
  });

  it("announces the demo reset result", async () => {
    const settingsActions = await renderSettings(
      demoSession,
      new MemoryUsageLimiter(10),
    );
    fireEvent.click(screen.getByRole("button", { name: "Reset demo data" }));
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "Demo data restored.",
      ),
    );
    expect(settingsActions.resetDemo).toHaveBeenCalledOnce();
  });

  it("confirms before deleting the account and reports a failure", async () => {
    const deleteAccount = vi.fn<SettingsAction>(async () => ({ ok: false }));
    await renderSettings(
      realSession,
      new MemoryUsageLimiter(10),
      actions({ deleteAccount }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Delete account" }));

    const dialog = await screen.findByRole("alertdialog");
    expect(dialog).toHaveAccessibleName("Delete your account?");
    expect(dialog).toHaveTextContent(
      "All entries and replies will be removed. You can't undo this.",
    );
    expect(deleteAccount).not.toHaveBeenCalled();

    const confirm = screen
      .getAllByRole("button", { name: "Delete account" })
      .find((button) => dialog.contains(button));
    if (!confirm) throw new Error("No confirm button in the dialog");
    fireEvent.click(confirm);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Couldn't delete your account. Try again.",
    );
    expect(deleteAccount).toHaveBeenCalledOnce();
  });

  it("logs a failed sign-out request and tells the user", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const signOut = vi.fn<SettingsAction>(async () => {
      throw new Error("Failed to fetch");
    });
    await renderSettings(
      demoSession,
      new MemoryUsageLimiter(10),
      actions({ signOut }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Couldn't sign you out. Try again.",
    );
    expect(log).toHaveBeenCalledWith(
      "[auth] signOut failed",
      expect.any(Error),
    );
  });
});

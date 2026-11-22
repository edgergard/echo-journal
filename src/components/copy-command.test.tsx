import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CopyCommand } from "./copy-command";

// jsdom has no Clipboard API, so each test installs its own stub.
function stubClipboard(writeText: (text: string) => Promise<void>) {
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    configurable: true,
  });
}

afterEach(() => {
  Reflect.deleteProperty(navigator, "clipboard");
});

describe("CopyCommand", () => {
  it("shows the command and an accessible copy button", () => {
    render(<CopyCommand command="npm run check" />);

    expect(
      screen.getByText("npm run check", { selector: "code" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /copy.*npm run check/i }),
    ).toBeEnabled();
  });

  it("copies the command and announces success", async () => {
    const writeText = vi
      .fn<(text: string) => Promise<void>>()
      .mockResolvedValue(undefined);
    stubClipboard(writeText);
    render(<CopyCommand command="npm run check" />);

    fireEvent.click(screen.getByRole("button", { name: /copy/i }));

    expect(
      await screen.findByRole("button", { name: /copied/i }),
    ).toBeInTheDocument();
    expect(writeText).toHaveBeenCalledExactlyOnceWith("npm run check");
    expect(screen.getByRole("status")).toHaveTextContent(
      "Command copied to clipboard",
    );
  });

  it("announces a repeated copy again", async () => {
    stubClipboard(() => Promise.resolve());
    render(<CopyCommand command="npm run check" />);
    const button = screen.getByRole("button", { name: /copy/i });

    fireEvent.click(button);
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Command copied to clipboard",
    );

    fireEvent.click(button);
    // The status resets before the second write, so the live region changes again.
    expect(screen.getByRole("status")).not.toHaveTextContent(
      "Command copied to clipboard",
    );
    expect(
      await screen.findByText("Command copied to clipboard"),
    ).toBeInTheDocument();
  });

  it("reports a failure when the clipboard rejects", async () => {
    stubClipboard(() => Promise.reject(new Error("Permission denied")));
    render(<CopyCommand command="npm run check" />);

    fireEvent.click(screen.getByRole("button", { name: /copy/i }));

    expect(
      await screen.findByRole("button", { name: /copy failed/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Could not copy the command",
    );
  });
});

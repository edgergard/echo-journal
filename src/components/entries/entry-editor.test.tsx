import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { EntryEditor } from "./entry-editor";

afterEach(cleanup);

function setup(onSubmit = vi.fn().mockResolvedValue({ ok: true })) {
  const onCancel = vi.fn();
  render(
    <EntryEditor
      submitLabel="Save entry"
      onSubmit={onSubmit}
      onCancel={onCancel}
      confirmDiscard
    />,
  );
  return { onSubmit, onCancel };
}

describe("EntryEditor", () => {
  it("rejects empty text and a missing mood", async () => {
    const { onSubmit } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Save entry" }));
    expect(await screen.findByText("Write something first.")).toBeTruthy();
    expect(screen.getByText("Pick how you feel.")).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("rejects text over 5000 characters", async () => {
    const { onSubmit } = setup();
    const area = screen.getByRole("textbox", { name: "Entry text" });
    fireEvent.click(area);
    fireEvent.change(area, { target: { value: "a".repeat(5001) } });
    fireEvent.click(screen.getByRole("radio", { name: "Good" }));
    fireEvent.click(screen.getByRole("button", { name: "Save entry" }));
    expect(
      await screen.findByText("Keep it under 5000 characters."),
    ).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits valid input", async () => {
    const { onSubmit } = setup();
    fireEvent.change(screen.getByRole("textbox", { name: "Entry text" }), {
      target: { value: "A quiet day" },
    });
    fireEvent.click(screen.getByRole("radio", { name: "Good" }));
    fireEvent.click(screen.getByRole("button", { name: "Save entry" }));
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        text: "A quiet day",
        mood: "good",
      }),
    );
  });

  it("keeps the text and shows the error when saving fails", async () => {
    setup(
      vi.fn().mockResolvedValue({
        ok: false,
        error: "Couldn't save your entry. Your text is still here — try again.",
      }),
    );
    const area = screen.getByRole("textbox", { name: "Entry text" });
    fireEvent.change(area, { target: { value: "Keep me" } });
    fireEvent.click(screen.getByRole("radio", { name: "Low" }));
    fireEvent.click(screen.getByRole("button", { name: "Save entry" }));
    expect((await screen.findByRole("alert")).textContent).toContain(
      "Your text is still here",
    );
    expect((area as HTMLTextAreaElement).value).toBe("Keep me");
  });

  it("cancels at once when empty, asks first when there is text", async () => {
    const { onCancel } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledTimes(1);

    fireEvent.change(screen.getByRole("textbox", { name: "Entry text" }), {
      target: { value: "draft" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(await screen.findByText("Discard this entry?")).toBeTruthy();
    expect(onCancel).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Discard" }));
    expect(onCancel).toHaveBeenCalledTimes(2);
  });
});

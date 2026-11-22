import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MoodPicker } from "./mood-picker";

afterEach(cleanup);

describe("MoodPicker", () => {
  it("exposes five labelled radios in a group", () => {
    render(<MoodPicker value={undefined} onChange={() => {}} />);
    expect(
      screen.getByRole("group", { name: "How are you feeling?" }),
    ).toBeTruthy();
    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(5);
    for (const name of ["Rough", "Low", "Okay", "Good", "Great"]) {
      expect(screen.getByRole("radio", { name })).toBeTruthy();
    }
  });

  it("checks only the selected mood", () => {
    render(<MoodPicker value="good" onChange={() => {}} />);
    expect(
      (screen.getByRole("radio", { name: "Good" }) as HTMLInputElement).checked,
    ).toBe(true);
    expect(
      (screen.getByRole("radio", { name: "Low" }) as HTMLInputElement).checked,
    ).toBe(false);
  });

  it("reports the picked mood", () => {
    const onChange = vi.fn();
    render(<MoodPicker value={undefined} onChange={onChange} />);
    fireEvent.click(screen.getByRole("radio", { name: "Okay" }));
    expect(onChange).toHaveBeenCalledWith("okay");
  });

  it("marks the group invalid and links the error", () => {
    render(
      <MoodPicker
        value={undefined}
        onChange={() => {}}
        invalid
        errorId="mood-error"
      />,
    );
    const group = screen.getByRole("group");
    expect(group.getAttribute("aria-invalid")).toBe("true");
    expect(group.getAttribute("aria-describedby")).toBe("mood-error");
  });
});

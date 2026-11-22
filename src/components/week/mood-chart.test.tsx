import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MoodChart } from "@/components/week/mood-chart";
import type { WeekDay } from "@/contracts/journal";

const days: WeekDay[] = [
  { date: "2026-11-16", mood: "okay" },
  { date: "2026-11-17", mood: "low" },
  { date: "2026-11-18", mood: null },
  { date: "2026-11-19", mood: null },
  { date: "2026-11-20", mood: "great" },
  { date: "2026-11-21", mood: null },
  { date: "2026-11-22", mood: null },
];

describe("MoodChart", () => {
  it("describes the week in an img label", () => {
    render(<MoodChart days={days} />);
    expect(
      screen.getByRole("img", {
        name: "Mood this week: Mon okay, Tue low, Fri great",
      }),
    ).toBeTruthy();
  });

  it("toggles an accessible table", () => {
    render(<MoodChart days={days} />);
    expect(screen.queryByRole("table")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Show as table" }));
    const table = screen.getByRole("table", { name: "Mood by day this week" });
    expect(table).toBeTruthy();
    expect(screen.getAllByText("No entry")).toHaveLength(4);
    fireEvent.click(screen.getByRole("button", { name: "Hide table" }));
    expect(screen.queryByRole("table")).toBeNull();
  });
});

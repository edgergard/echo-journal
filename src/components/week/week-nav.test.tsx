import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { WeekNav } from "@/components/week/week-nav";

describe("WeekNav", () => {
  it("disables Next week on the current week", () => {
    render(<WeekNav previousWeek="2026-11-09" nextWeek={null} />);
    expect(
      screen.getByRole("link", { name: "Previous week" }).getAttribute("href"),
    ).toBe("/week?week=2026-11-09");
    const next = screen.getByRole("button", { name: "Next week" });
    expect((next as HTMLButtonElement).disabled).toBe(true);
    expect(screen.queryByRole("link", { name: "Next week" })).toBeNull();
  });

  it("links to both neighbouring weeks on a past week", () => {
    render(<WeekNav previousWeek="2026-11-02" nextWeek="2026-11-16" />);
    expect(
      screen.getByRole("link", { name: "Previous week" }).getAttribute("href"),
    ).toBe("/week?week=2026-11-02");
    expect(
      screen.getByRole("link", { name: "Next week" }).getAttribute("href"),
    ).toBe("/week?week=2026-11-16");
  });
});

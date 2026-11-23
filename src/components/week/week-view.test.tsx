import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { WeekView, type WeekViewData } from "@/components/week/week-view";

function data(status: WeekViewData["summary"]["status"]): WeekViewData {
  return {
    summary: {
      weekStart: "2026-11-16",
      status,
      days: Array.from({ length: 7 }, (_, i) => ({
        date: `2026-11-${16 + i}`,
        mood: null,
      })),
      themes:
        status === "done"
          ? [{ title: "Moving", text: "Boxes.", entryIds: [] }]
          : [],
      entryCount: status === "empty" ? 1 : 3,
      generatedAt: "2026-11-22T10:00:00.000Z",
    },
    entryDates: {},
  };
}

describe("WeekView", () => {
  it("shows the empty state with a New entry link", () => {
    render(
      <WeekView initial={data("empty")} refresh={vi.fn()} dailyLimit={10} />,
    );
    expect(
      screen.getByText(
        "Write at least two entries this week to see a summary.",
      ),
    ).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "New entry" }).getAttribute("href"),
    ).toBe("/journal/new");
  });

  it("shows the limit state", () => {
    render(
      <WeekView initial={data("limit")} refresh={vi.fn()} dailyLimit={10} />,
    );
    expect(screen.getByText(/You've used today's 10 replies\./)).toBeTruthy();
  });

  it("recovers from an error with Try again", async () => {
    const refresh = vi.fn(async () => data("done"));
    render(
      <WeekView initial={data("error")} refresh={refresh} dailyLimit={10} />,
    );
    expect(
      screen.getByText("Couldn't build this week's summary."),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(screen.getByText("Moving")).toBeTruthy());
    expect(refresh).toHaveBeenCalledWith("2026-11-16");
  });

  it("refreshes the summary", async () => {
    const refresh = vi.fn(async () => data("done"));
    render(
      <WeekView initial={data("done")} refresh={refresh} dailyLimit={10} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Refresh summary" }));
    await waitFor(() => expect(refresh).toHaveBeenCalledOnce());
  });
});

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ThemeList } from "@/components/week/theme-list";

describe("ThemeList", () => {
  it("links each theme to its entries", () => {
    render(
      <ThemeList
        themes={[{ title: "Moving", text: "A lot of boxes.", entryIds: ["a"] }]}
        entryDates={{ a: "2026-11-17T10:00:00.000Z" }}
      />,
    );
    expect(screen.getByRole("heading", { name: "Moving" })).toBeTruthy();
    const link = screen.getByRole("link", { name: "Entry · Tue, Nov 17" });
    expect(link.getAttribute("href")).toBe("/journal/a");
  });
});

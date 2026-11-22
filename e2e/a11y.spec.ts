import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import { startDemo } from "./helpers";

async function expectNoSeriousViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  const serious = violations.filter(
    (v) => v.impact === "serious" || v.impact === "critical",
  );
  expect(
    serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(" | ")}`),
  ).toEqual([]);
}

for (const colorScheme of ["light", "dark"] as const) {
  test.describe(`axe (${colorScheme})`, () => {
    test.use({ colorScheme });

    test("landing and sign-in", async ({ page }) => {
      await page.goto("/");
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expectNoSeriousViolations(page);

      await page.goto("/sign-in");
      await expect(
        page.getByRole("heading", { level: 1, name: "Sign in to Echo" }),
      ).toBeVisible();
      await expectNoSeriousViolations(page);
    });

    test("app screens", async ({ page }) => {
      await startDemo(page);
      await expectNoSeriousViolations(page);

      await page.goto("/journal/new");
      await expect(page.getByLabel("Entry text")).toBeVisible();
      await expectNoSeriousViolations(page);

      await page.goto("/journal/demo-e01");
      await expect(
        page.getByRole("complementary", { name: "Recalled entries" }),
      ).toBeVisible();
      await expectNoSeriousViolations(page);

      await page.goto("/week");
      await expect(page.getByRole("img").first()).toBeVisible();
      await expectNoSeriousViolations(page);

      await page.goto("/settings");
      await expect(page.getByText(/Replies left today/)).toBeVisible();
      await expectNoSeriousViolations(page);
    });
  });
}

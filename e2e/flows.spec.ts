import { expect, test } from "@playwright/test";

import { resetDemoData, startDemo, writeEntry } from "./helpers";

test("demo flow: landing → journal → entry with recalled notes → week", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { level: 1, name: "A journal that remembers." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Try the demo" }).click();
  await expect(page).toHaveURL(/\/journal$/);

  await page.goto("/journal/demo-e01");
  await expect(
    page.getByRole("complementary", { name: "Recalled entries" }),
  ).toBeVisible();
  await expect(page.getByText(/^Recalled from /).first()).toBeVisible();

  await page.getByRole("link", { name: "Week", exact: true }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: "This week" }),
  ).toBeVisible();
  await expect(page.getByRole("img").first()).toBeVisible();
  await page.getByRole("button", { name: "Show as table" }).click();
  await expect(page.getByRole("table")).toBeVisible();
});

test("loop: new entry → saved → streamed reply → recalled note link", async ({
  page,
}) => {
  await startDemo(page);
  await writeEntry(
    page,
    "Argued with Dad again about the move. I said things I didn't mean.",
    "Low",
  );

  await expect(
    page.getByRole("status").filter({ hasText: "Entry saved" }),
  ).toBeVisible();
  await expect(
    page.getByRole("status").filter({ hasText: "Reply ready" }),
  ).toBeAttached({ timeout: 30_000 });
  await expect(
    page.getByText("Thank you for putting this into words."),
  ).toBeVisible();

  const recalled = page.getByRole("complementary", {
    name: "Recalled entries",
  });
  await expect(recalled).toBeVisible();
  await expect(page).not.toHaveURL(/saved=1/);
  const link = recalled.getByRole("link", { name: /Open entry from/ }).first();
  await link.click();
  await expect(page).toHaveURL(/\/journal\/[^/?]+$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("guards: crisis phrase shows the crisis card, no reply", async ({
  page,
}) => {
  await startDemo(page);
  await writeEntry(page, "Some days I feel like I want to die.", "Rough");

  await expect(
    page.getByText("You don’t have to carry this alone"),
  ).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByRole("link", { name: "988" })).toBeVisible();
  await expect(
    page.getByText("Thank you for putting this into words."),
  ).toHaveCount(0);
});

test("guards: empty entry shows validation errors", async ({ page }) => {
  await startDemo(page);
  await page.goto("/journal/new");
  await page.getByRole("button", { name: "Save entry" }).click();
  await expect(page.getByRole("alert").first()).toBeVisible();
  await expect(page.getByText("Pick how you feel.")).toBeVisible();
  await expect(page).toHaveURL(/\/journal\/new$/);
});

test("auth gate: /journal without a session redirects to /sign-in", async ({
  page,
}) => {
  await page.goto("/journal");
  await expect(page).toHaveURL(/\/sign-in/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Sign in to Echo" }),
  ).toBeVisible();
});

test("delete entry removes it from the journal", async ({ page }) => {
  await startDemo(page);
  await writeEntry(page, "A throwaway note about the weather today.", "Okay");
  await expect(
    page.getByText("A throwaway note about the weather today."),
  ).toBeVisible();

  await page.getByRole("button", { name: "Entry actions" }).click();
  await page.getByRole("menuitem", { name: "Delete" }).click();
  await page.getByRole("button", { name: "Delete entry" }).click();

  await expect(page).toHaveURL(/\/journal\?deleted=1/);
  await expect(page.getByText("Entry deleted")).toBeVisible();
  await expect(
    page.getByText("A throwaway note about the weather today."),
  ).not.toBeVisible();
  await resetDemoData(page);
});

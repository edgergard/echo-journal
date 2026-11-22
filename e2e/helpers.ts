import { expect, type Page } from "@playwright/test";

/** Landing → "Try the demo" → journal (fresh cookie per test context). */
export async function startDemo(page: Page): Promise<void> {
  await page.goto("/");
  await page.getByRole("button", { name: "Try the demo" }).click();
  // The first server action after a cold `next start` can be slow.
  await expect(page).toHaveURL(/\/journal$/, { timeout: 20_000 });
  await expect(
    page.getByRole("heading", { level: 1, name: "Journal" }),
  ).toBeVisible();
}

/** Fills the new-entry form and saves it; lands on the entry page. */
export async function writeEntry(
  page: Page,
  text: string,
  mood = "Okay",
): Promise<void> {
  await page.goto("/journal/new");
  await page.getByLabel("Entry text").fill(text);
  await page.getByText(mood, { exact: true }).click();
  await page.getByRole("button", { name: "Save entry" }).click();
  await expect(page).toHaveURL(/\/journal\/[^/?]+/);
}

/** Settings → "Reset demo data": puts the seed back (demo mode only). */
export async function resetDemoData(page: Page): Promise<void> {
  await page.goto("/settings");
  await page.getByRole("button", { name: "Reset demo data" }).click();
  await expect(page.getByText("Demo data restored.")).toBeVisible();
}

import { expect, test } from "@playwright/test";

test("shows the initialized application", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Doodle Chat" })).toBeVisible();
});

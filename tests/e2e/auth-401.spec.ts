import { expect, test } from "@playwright/test";

test.beforeEach(async ({ context }) => {
  await context.clearCookies();
});

test("ends the session when the backend rejects it", async ({ context, page }) => {
  await page.route("http://localhost:3000/api/v1/messages**", async (route) => {
    const request = route.request();

    if (request.method() === "OPTIONS") {
      await route.fulfill({
        headers: {
          "Access-Control-Allow-Headers": "authorization,content-type",
          "Access-Control-Allow-Methods": "GET,OPTIONS",
          "Access-Control-Allow-Origin": "http://localhost:3002",
        },
        status: 204,
      });
      return;
    }

    await route.fulfill({
      body: JSON.stringify({ error: "Unauthorized" }),
      contentType: "application/json",
      headers: { "Access-Control-Allow-Origin": "http://localhost:3002" },
      status: 401,
    });
  });

  await page.goto("/login");
  await page.getByLabel("Username").fill("Ada Lovelace");
  await page.getByRole("button", { name: "Join the chat" }).click();

  await expect(page).toHaveURL(/\/login$/);
  const cookies = await context.cookies();

  expect(cookies.some(({ name }) => name === "access_token")).toBe(false);
  expect(cookies.some(({ name }) => name === "username")).toBe(false);
});

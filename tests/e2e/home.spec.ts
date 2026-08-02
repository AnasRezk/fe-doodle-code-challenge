import { expect, test } from "@playwright/test";

test.beforeEach(async ({ context }) => {
  await context.clearCookies();
});

test("logs in and protects the chat routes", async ({ context, page }) => {
  const messageRequests: Array<{ authorization: string | undefined; url: string }> = [];
  const firstPage = Array.from({ length: 1000 }, (_, index) => ({
    _id: String(index),
    message: `Message ${index}`,
    author: "Ada Lovelace",
    createdAt: new Date(Date.UTC(2024, 0, 12, 10, 30) - index * 1000).toISOString(),
  }));
  const oldestFirstPageMessage = firstPage.at(-1);

  if (!oldestFirstPageMessage) {
    throw new Error("The messages fixture must not be empty.");
  }

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

    messageRequests.push({
      authorization: request.headers().authorization,
      url: request.url(),
    });

    const before = new URL(request.url()).searchParams.get("before");

    await route.fulfill({
      body: JSON.stringify(before ? [{ ...oldestFirstPageMessage, _id: "older-message" }] : firstPage),
      contentType: "application/json",
      headers: { "Access-Control-Allow-Origin": "http://localhost:3002" },
      status: 200,
    });
  });

  await page.goto("/");

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Join the conversation" })).toBeVisible();
  expect(messageRequests).toHaveLength(0);

  await page.getByLabel("Username").fill("A");
  await page.getByRole("button", { name: "Join the chat" }).click();
  await expect(page.getByText("Username must contain at least 2 characters.", { exact: true })).toBeVisible();

  await page.getByLabel("Username").fill("Ada Lovelace");
  await page.getByRole("button", { name: "Join the chat" }).click();

  await expect(page).toHaveURL(/\/group-chat$/);
  await expect(page.getByText("Signed in as Ada Lovelace")).toBeVisible();

  await expect
    .poll(() =>
      messageRequests.some(({ url }) =>
        url.includes(`before=${encodeURIComponent(oldestFirstPageMessage.createdAt)}`),
      ),
    )
    .toBe(true);
  expect(messageRequests.some(({ url }) => url.includes("limit=1000") && !url.includes("before="))).toBe(
    true,
  );
  const cookies = await context.cookies();
  const accessToken = cookies.find(({ name }) => name === "access_token")?.value;

  expect(cookies.find(({ name }) => name === "username")?.value).toBe("Ada%20Lovelace");
  expect(accessToken).toBeTruthy();
  expect(messageRequests.every(({ authorization }) => authorization === `Bearer ${accessToken}`)).toBe(
    true,
  );

  await page.goto("/login");
  await expect(page).toHaveURL(/\/group-chat$/);
});

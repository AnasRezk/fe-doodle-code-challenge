import { expect, test } from "@playwright/test";

test.beforeEach(async ({ context }) => {
  await context.clearCookies();
});

test("logs in and protects the chat routes", async ({ context, page }) => {
  const messageRequests: Array<{
    authorization: string | undefined;
    body?: unknown;
    method: string;
    url: string;
  }> = [];
  const firstPage = Array.from({ length: 10 }, (_, index) => ({
    _id: String(index),
    message: `Message ${index}`,
    author: "Ada Lovelace",
    createdAt: new Date(Date.UTC(2024, 0, 12, 10, 30) + index * 1000).toISOString(),
  }));
  const oldestFirstPageMessage = firstPage[0];

  if (!oldestFirstPageMessage) {
    throw new Error("The messages fixture must not be empty.");
  }

  const olderMessage = {
    ...oldestFirstPageMessage,
    _id: "older-message",
    createdAt: new Date(new Date(oldestFirstPageMessage.createdAt).getTime() - 1000).toISOString(),
    message: "An older message",
  };

  await page.route("http://localhost:3000/api/v1/messages**", async (route) => {
    const request = route.request();

    if (request.method() === "OPTIONS") {
      await route.fulfill({
        headers: {
          "Access-Control-Allow-Headers": "authorization,content-type",
          "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
          "Access-Control-Allow-Origin": "http://localhost:3002",
        },
        status: 204,
      });
      return;
    }

    messageRequests.push({
      authorization: request.headers().authorization,
      body: request.method() === "POST" ? request.postDataJSON() : undefined,
      method: request.method(),
      url: request.url(),
    });

    if (request.method() === "POST") {
      const body = request.postDataJSON() as { author: string; message: string };

      await route.fulfill({
        body: JSON.stringify({
          _id: "sent-message",
          ...body,
          createdAt: "2024-01-12T10:31:00.000Z",
        }),
        contentType: "application/json",
        headers: { "Access-Control-Allow-Origin": "http://localhost:3002" },
        status: 201,
      });
      return;
    }

    const before = new URL(request.url()).searchParams.get("before");
    const isOlderPageRequest = before === oldestFirstPageMessage.createdAt;

    await route.fulfill({
      body: JSON.stringify(isOlderPageRequest ? [olderMessage] : firstPage),
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
  const messageFeed = page.getByRole("log", { name: "Group chat messages" });
  await expect(messageFeed).toBeVisible();
  await expect(page.getByText("Message 9", { exact: true })).toBeVisible();

  const messageInput = page.getByRole("textbox", { name: "Message", exact: true });
  await messageInput.fill("Hello from the composer");
  await page.getByRole("button", { name: "Send" }).click();

  await expect(page.getByText("Hello from the composer", { exact: true })).toBeVisible();
  await expect(messageInput).toBeFocused();
  await expect
    .poll(async () => (await messageFeed.locator("article").allTextContents()).at(-1))
    .toContain("Hello from the composer");
  await expect
    .poll(() => messageRequests.find(({ method }) => method === "POST")?.body)
    .toEqual({ author: "Ada Lovelace", message: "Hello from the composer" });

  await expect
    .poll(() =>
      messageRequests.some(({ method, url }) => {
        const requestUrl = new URL(url);

        return (
          method === "GET" &&
          requestUrl.searchParams.get("limit") === "10" &&
          Boolean(requestUrl.searchParams.get("before")) &&
          requestUrl.searchParams.get("before") !== oldestFirstPageMessage.createdAt
        );
      }),
    )
    .toBe(true);
  expect(
    messageRequests.some(({ method, url }) => {
      const requestUrl = new URL(url);

      return (
        method === "GET" &&
        requestUrl.searchParams.get("before") === oldestFirstPageMessage.createdAt
      );
    }),
  ).toBe(false);

  await messageFeed.evaluate((element) => {
    element.scrollTop = 0;
    element.dispatchEvent(new Event("scroll", { bubbles: true }));
  });

  await expect
    .poll(() =>
      messageRequests.some(({ url }) =>
        url.includes(`before=${encodeURIComponent(oldestFirstPageMessage.createdAt)}`),
      ),
    )
    .toBe(true);
  await expect.poll(() => messageFeed.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  const cookies = await context.cookies();
  const accessToken = cookies.find(({ name }) => name === "access_token")?.value;

  expect(cookies.find(({ name }) => name === "username")?.value).toBe("Ada%20Lovelace");
  expect(accessToken).toBeTruthy();
  expect(
    messageRequests.every(({ authorization }) => authorization === `Bearer ${accessToken}`),
  ).toBe(true);

  await page.goto("/login");
  await expect(page).toHaveURL(/\/group-chat$/);
});

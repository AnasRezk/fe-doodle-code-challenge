import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createMessage, listMessages, MessagesApiError } from "./messages";

const message = {
  _id: "123e4567-e89b-12d3-a456-426614174000",
  message: "Hello everyone!",
  author: "Ada",
  createdAt: "2024-01-12T10:30:00Z",
};

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "http://localhost:3000");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("listMessages", () => {
  it("loads an older page with the bearer token", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([message]), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      listMessages({
        accessToken: "session-token",
        before: "2024-01-12T15:45:00Z",
        limit: 50,
      }),
    ).resolves.toEqual([message]);

    const [url, init] = fetchMock.mock.calls[0] as unknown as [URL, RequestInit];
    const headers = new Headers(init.headers);

    expect(url.toString()).toBe(
      "http://localhost:3000/api/v1/messages?limit=50&before=2024-01-12T15%3A45%3A00Z",
    );
    expect(headers.get("accept")).toBe("application/json");
    expect(headers.get("authorization")).toBe("Bearer session-token");
  });

  it("returns an actionable error for a failed request", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 500 })));

    await expect(listMessages({ accessToken: "session-token" })).rejects.toEqual(
      new MessagesApiError("Unable to load messages (500).", 500),
    );
  });

  it("rejects an invalid response contract", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify([{ message: "Missing fields" }]), { status: 200 }),
      ),
    );

    await expect(listMessages({ accessToken: "session-token" })).rejects.toEqual(
      new MessagesApiError("The messages API returned an invalid response.", 200),
    );
  });
});

describe("createMessage", () => {
  it("posts the message and author through the authenticated API client", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(message), {
        headers: { "Content-Type": "application/json" },
        status: 201,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      createMessage({
        accessToken: "session-token",
        author: "Ada",
        message: "Hello everyone!",
      }),
    ).resolves.toEqual(message);

    const [url, init] = fetchMock.mock.calls[0] as unknown as [URL, RequestInit];
    const headers = new Headers(init.headers);

    expect(url.toString()).toBe("http://localhost:3000/api/v1/messages");
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify({ author: "Ada", message: "Hello everyone!" }));
    expect(headers.get("authorization")).toBe("Bearer session-token");
    expect(headers.get("content-type")).toBe("application/json");
  });

  it("returns an actionable send error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 500 })));

    await expect(
      createMessage({ accessToken: "session-token", author: "Ada", message: "Hello" }),
    ).rejects.toEqual(new MessagesApiError("Unable to send message (500).", 500));
  });
});

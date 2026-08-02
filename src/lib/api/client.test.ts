import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiFetch, ApiConfigurationError } from "./client";

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "http://localhost:3000");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("apiFetch", () => {
  it("sets the bearer authorization header on every request", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    await apiFetch("/api/v1/messages", {
      accessToken: "session-token",
      headers: {
        Accept: "application/json",
        authorization: "Bearer incorrect-token",
      },
    });

    const [url, init] = fetchMock.mock.calls[0] as unknown as [URL, RequestInit];
    const headers = new Headers(init.headers);

    expect(url.toString()).toBe("http://localhost:3000/api/v1/messages");
    expect(headers.get("accept")).toBe("application/json");
    expect(headers.get("authorization")).toBe("Bearer session-token");
  });

  it("rejects requests without an access token", async () => {
    await expect(apiFetch("/api/v1/messages", { accessToken: "" })).rejects.toEqual(
      new ApiConfigurationError("An access token is required for API requests."),
    );
  });

  it("ends the session and redirects when the backend returns 401", async () => {
    const replace = vi.fn();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("location", { replace });

    await expect(
      apiFetch("/api/v1/messages", { accessToken: "expired-token" }),
    ).resolves.toHaveProperty("status", 401);

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/auth/logout",
      expect.objectContaining({ method: "POST" }),
    );
    expect(replace).toHaveBeenCalledWith("/login");
  });
});

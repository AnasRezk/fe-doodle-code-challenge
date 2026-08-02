import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { proxy } from "./proxy";

function request(pathname: string, cookie?: string) {
  return new NextRequest(`http://localhost${pathname}`, {
    headers: cookie ? { cookie } : undefined,
  });
}

describe("authentication proxy", () => {
  it("redirects an unauthenticated landing request to login", () => {
    const response = proxy(request("/"));

    expect(response.headers.get("location")).toBe("http://localhost/login");
  });

  it("redirects an authenticated landing request to the group chat", () => {
    const response = proxy(request("/", "access_token=token; username=Ada"));

    expect(response.headers.get("location")).toBe("http://localhost/group-chat");
  });

  it("requires both cookies for a protected route", () => {
    const response = proxy(request("/group-chat", "username=Ada"));

    expect(response.headers.get("location")).toBe("http://localhost/login");
  });

  it("redirects an authenticated user away from login", () => {
    const response = proxy(request("/login", "access_token=token; username=Ada"));

    expect(response.headers.get("location")).toBe("http://localhost/group-chat");
  });
});

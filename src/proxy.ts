import { type NextRequest, NextResponse } from "next/server";

import { ACCESS_TOKEN_COOKIE, USERNAME_COOKIE } from "@/lib/auth/cookies";

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value.trim();
  const username = request.cookies.get(USERNAME_COOKIE)?.value.trim();
  const isAuthenticated = Boolean(accessToken && username);

  if (isAuthenticated && (pathname === "/" || pathname === "/login")) {
    return NextResponse.redirect(new URL("/group-chat", request.url));
  }

  if (!isAuthenticated && (pathname === "/" || pathname.startsWith("/group-chat"))) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/group-chat/:path*"],
};

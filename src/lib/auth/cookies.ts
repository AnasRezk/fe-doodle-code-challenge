export const ACCESS_TOKEN_COOKIE = "access_token";
export const USERNAME_COOKIE = "username";

export const SESSION_COOKIE_OPTIONS = {
  path: "/",
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
} as const;

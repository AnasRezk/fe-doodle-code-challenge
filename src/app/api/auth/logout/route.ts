import { cookies } from "next/headers";

import { ACCESS_TOKEN_COOKIE, USERNAME_COOKIE } from "@/lib/auth/cookies";

export async function POST() {
  const cookieStore = await cookies();

  cookieStore.delete(ACCESS_TOKEN_COOKIE);
  cookieStore.delete(USERNAME_COOKIE);

  return new Response(null, { status: 204 });
}

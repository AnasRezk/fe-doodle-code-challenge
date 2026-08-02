"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  ACCESS_TOKEN_COOKIE,
  SESSION_COOKIE_OPTIONS,
  USERNAME_COOKIE,
} from "@/lib/auth/cookies";
import { validateUsername } from "@/lib/auth/username";

export type LoginState = {
  error: string | null;
};

export async function login(_state: LoginState, formData: FormData): Promise<LoginState> {
  const result = validateUsername(formData.get("username"));

  if ("error" in result) {
    return { error: result.error ?? "Enter a username to continue." };
  }

  const cookieStore = await cookies();

  cookieStore.set(USERNAME_COOKIE, result.username, SESSION_COOKIE_OPTIONS);
  cookieStore.set(ACCESS_TOKEN_COOKIE, 'super-secret-doodle-token', SESSION_COOKIE_OPTIONS);

  redirect("/group-chat");
}

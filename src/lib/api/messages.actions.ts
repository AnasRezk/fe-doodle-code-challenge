"use server";

import { cookies } from "next/headers";

import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/cookies";

import { apiFetch } from "./client";
import {
  getMessagesPath,
  isMessage,
  MESSAGES_PATH,
  type CreateMessageInput,
  type CreateMessageOptions,
  type ListMessagesOptions,
  type Message,
  type MessagesActionResult,
} from "./messages";

async function getAccessToken() {
  const cookieStore = await cookies();
  // The proxy guarantees this cookie before any protected route is rendered.
  return cookieStore.get(ACCESS_TOKEN_COOKIE)!.value.trim();
}

export async function listMessages(
  options: ListMessagesOptions = {},
): Promise<MessagesActionResult<Message[]>> {
  let response: Response;

  try {
    response = await apiFetch(getMessagesPath(options), {
      accessToken: await getAccessToken(),
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });
  } catch {
    return { message: "Unable to reach the messages API.", ok: false, status: 0 };
  }

  if (!response.ok) {
    return {
      message: `Unable to load messages (${response.status}).`,
      ok: false,
      status: response.status,
    };
  }

  const payload: unknown = await response.json();

  if (!Array.isArray(payload) || !payload.every(isMessage)) {
    return {
      message: "The messages API returned an invalid response.",
      ok: false,
      status: response.status,
    };
  }

  return { data: payload, ok: true };
}

export async function createMessage(
  options: CreateMessageOptions,
): Promise<MessagesActionResult<Message>> {
  let response: Response;

  try {
    response = await apiFetch(MESSAGES_PATH, {
      accessToken: await getAccessToken(),
      body: JSON.stringify({
        author: options.author,
        message: options.message,
      } satisfies CreateMessageInput),
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      method: "POST",
    });
  } catch {
    return { message: "Unable to reach the messages API.", ok: false, status: 0 };
  }

  if (!response.ok) {
    return {
      message: `Unable to send message (${response.status}).`,
      ok: false,
      status: response.status,
    };
  }

  const payload: unknown = await response.json();

  if (!isMessage(payload)) {
    return {
      message: "The messages API returned an invalid response.",
      ok: false,
      status: response.status,
    };
  }

  return { data: payload, ok: true };
}

import { apiFetch } from "./client";

const MESSAGES_PATH = "/api/v1/messages";

export const MESSAGES_PAGE_SIZE = 20;

export type Message = {
  _id: string;
  message: string;
  author: string;
  createdAt: string;
};

export type ListMessagesOptions = {
  accessToken: string;
  before?: string;
  limit?: number;
  signal?: AbortSignal;
};

export type CreateMessageInput = {
  message: string;
  author: string;
};

export type CreateMessageOptions = CreateMessageInput & {
  accessToken: string;
  signal?: AbortSignal;
};

export class MessagesApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "MessagesApiError";
  }
}

function isMessage(value: unknown): value is Message {
  if (!value || typeof value !== "object") {
    return false;
  }

  const message = value as Record<string, unknown>;

  return (
    typeof message._id === "string" &&
    typeof message.message === "string" &&
    typeof message.author === "string" &&
    typeof message.createdAt === "string"
  );
}

function getMessagesPath({ before, limit = MESSAGES_PAGE_SIZE }: ListMessagesOptions) {
  const searchParams = new URLSearchParams({ limit: String(limit) });

  if (before) {
    searchParams.set("before", before);
  }

  return `${MESSAGES_PATH}?${searchParams.toString()}`;
}

export async function listMessages(options: ListMessagesOptions): Promise<Message[]> {
  const response = await apiFetch(getMessagesPath(options), {
    accessToken: options.accessToken,
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
    signal: options.signal,
  });

  if (!response.ok) {
    throw new MessagesApiError(`Unable to load messages (${response.status}).`, response.status);
  }

  const payload: unknown = await response.json();

  if (!Array.isArray(payload) || !payload.every(isMessage)) {
    throw new MessagesApiError("The messages API returned an invalid response.", response.status);
  }

  return payload;
}

export async function createMessage(options: CreateMessageOptions): Promise<Message> {
  const response = await apiFetch(MESSAGES_PATH, {
    accessToken: options.accessToken,
    body: JSON.stringify({
      author: options.author,
      message: options.message,
    } satisfies CreateMessageInput),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    method: "POST",
    signal: options.signal,
  });

  if (!response.ok) {
    throw new MessagesApiError(`Unable to send message (${response.status}).`, response.status);
  }

  const payload: unknown = await response.json();

  if (!isMessage(payload)) {
    throw new MessagesApiError("The messages API returned an invalid response.", response.status);
  }

  return payload;
}

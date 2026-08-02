export const MESSAGES_PATH = "/api/v1/messages";

export const MESSAGES_PAGE_SIZE = 20;

export type Message = {
  _id: string;
  message: string;
  author: string;
  createdAt: string;
};

export type ListMessagesOptions = {
  after?: string;
  before?: string;
  limit?: number;
};

export type CreateMessageInput = {
  message: string;
  author: string;
};

export type CreateMessageOptions = CreateMessageInput;

export class MessagesApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "MessagesApiError";
  }
}

// Server Actions redact thrown error messages in production, so actions report
// failure through this return value instead of throwing across the RPC boundary.
export type MessagesActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string; status: number };

export function unwrapMessagesResult<T>(result: MessagesActionResult<T>): T {
  if (!result.ok) {
    throw new MessagesApiError(result.message, result.status);
  }

  return result.data;
}

export function isMessage(value: unknown): value is Message {
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

export function getMessagesPath({ after, before, limit = MESSAGES_PAGE_SIZE }: ListMessagesOptions) {
  const searchParams = new URLSearchParams({ limit: String(limit) });

  if (after) {
    searchParams.set("after", after);
  }

  if (before) {
    searchParams.set("before", before);
  }

  return `${MESSAGES_PATH}?${searchParams.toString()}`;
}

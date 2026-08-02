import { describe, expect, it } from "vitest";

import { MAX_MESSAGES_PAGE_SIZE, type Message } from "@/lib/api/messages";

import { getNextMessagesCursor, messagesQueryKeys } from "./use-messages-query";

const createMessage = (index: number): Message => ({
  _id: String(index),
  message: `Message ${index}`,
  author: "Ada",
  createdAt: new Date(Date.UTC(2024, 0, 12, 10, 30, index)).toISOString(),
});

describe("messages query pagination", () => {
  it("uses a stable history key", () => {
    expect(messagesQueryKeys.history()).toEqual(["messages", "history"]);
  });

  it("continues from the oldest message when a page is full", () => {
    const page = Array.from({ length: MAX_MESSAGES_PAGE_SIZE }, (_, index) =>
      createMessage(index),
    );

    expect(getNextMessagesCursor(page)).toBe(page.at(-1)?.createdAt);
  });

  it("stops loading when the final page is not full", () => {
    expect(getNextMessagesCursor([createMessage(1)])).toBeUndefined();
  });
});

import { describe, expect, it } from "vitest";

import { MESSAGES_PAGE_SIZE, type Message } from "@/lib/api/messages";

import {
  getInitialMessagesCursor,
  getNextMessagesCursor,
  mergeMessagePages,
  messagesQueryKeys,
} from "./use-messages-query";

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

  it("starts from a before cursor so the API returns the newest page", () => {
    expect(getInitialMessagesCursor(new Date("2024-01-12T10:30:00.000Z"))).toBe(
      "2024-01-12T10:30:00.000Z",
    );
  });

  it("continues from the oldest message when a page is full", () => {
    const page = Array.from({ length: MESSAGES_PAGE_SIZE }, (_, index) =>
      createMessage(index),
    );

    expect(getNextMessagesCursor(page)).toBe(page[0]?.createdAt);
  });

  it("stops loading when the final page is not full", () => {
    expect(getNextMessagesCursor([createMessage(1)])).toBeUndefined();
  });

  it("sorts mixed page orders chronologically and removes cursor duplicates", () => {
    const newest = createMessage(3);
    const cursorMessage = createMessage(2);
    const oldest = createMessage(1);

    expect(mergeMessagePages([[oldest, cursorMessage], [newest, cursorMessage]])).toEqual([
      oldest,
      cursorMessage,
      newest,
    ]);
  });
});

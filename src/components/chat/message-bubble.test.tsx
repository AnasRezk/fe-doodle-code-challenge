import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { Message } from "@/lib/api/messages";

import { MessageBubble } from "./message-bubble";

const message: Message = {
  _id: "message-1",
  author: "Grace",
  createdAt: "2024-01-12T10:30:00Z",
  message: "Hello Ada",
};

describe("MessageBubble", () => {
  it("identifies the current user's message", () => {
    render(<MessageBubble isMine message={message} />);

    expect(screen.getByRole("article", { name: "You at 12 Jan 2024 10:30" })).toBeVisible();
    expect(screen.getByText("You")).toBeVisible();
    expect(screen.queryByText("Grace")).not.toBeInTheDocument();
  });

  it("identifies a participant message by author", () => {
    render(<MessageBubble isMine={false} message={message} />);

    const bubble = screen.getByRole("article", { name: "Grace at 12 Jan 2024 10:30" });

    expect(bubble).toBeVisible();
    expect(within(bubble).getByText("Grace")).toBeVisible();
    expect(within(bubble).getByText("Hello Ada")).toBeVisible();
  });
});

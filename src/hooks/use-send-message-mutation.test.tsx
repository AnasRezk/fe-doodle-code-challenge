import type { ReactNode } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createMessage, type Message } from "@/lib/api/messages";

import { messagesQueryKeys } from "./use-messages-query";
import {
  type MessagesCache,
  useSendMessageMutation,
} from "./use-send-message-mutation";

vi.mock("@/lib/api/messages", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/messages")>();

  return {
    ...actual,
    createMessage: vi.fn(),
  };
});

const existingMessage: Message = {
  _id: "existing-message",
  author: "Grace",
  createdAt: "2024-01-12T10:30:00.000Z",
  message: "Existing message",
};

function setup() {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false },
    },
  });
  const initialCache: MessagesCache = {
    pageParams: [undefined],
    pages: [[existingMessage]],
  };

  queryClient.setQueryData(messagesQueryKeys.history(), initialCache);

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const hook = renderHook(() => useSendMessageMutation("session-token"), { wrapper });

  return { hook, initialCache, queryClient };
}

describe("useSendMessageMutation", () => {
  beforeEach(() => {
    vi.mocked(createMessage).mockReset();
  });

  it("adds a message immediately and replaces it with the server response", async () => {
    let resolveRequest: (message: Message) => void = () => undefined;
    vi.mocked(createMessage).mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve;
      }),
    );
    const { hook, queryClient } = setup();

    act(() => {
      hook.result.current.mutate({ author: "Ada", message: "Hello" });
    });

    await waitFor(() => {
      const cache = queryClient.getQueryData<MessagesCache>(messagesQueryKeys.history());
      expect(cache?.pages[0][0]).toMatchObject({
        author: "Ada",
        message: "Hello",
      });
      expect(cache?.pages[0][0]._id).toMatch(/^optimistic-/);
    });

    const confirmedMessage: Message = {
      _id: "confirmed-message",
      author: "Ada",
      createdAt: "2024-01-12T10:31:00.000Z",
      message: "Hello",
    };

    act(() => resolveRequest(confirmedMessage));

    await waitFor(() => {
      const cache = queryClient.getQueryData<MessagesCache>(messagesQueryKeys.history());
      expect(cache?.pages[0][0]).toEqual(confirmedMessage);
    });
  });

  it("restores the exact previous cache when sending fails", async () => {
    vi.mocked(createMessage).mockRejectedValue(new Error("Network unavailable"));
    const { hook, initialCache, queryClient } = setup();

    act(() => {
      hook.result.current.mutate({ author: "Ada", message: "Please retry" });
    });

    await waitFor(() => expect(hook.result.current.isError).toBe(true));

    expect(queryClient.getQueryData(messagesQueryKeys.history())).toEqual(initialCache);
  });
});

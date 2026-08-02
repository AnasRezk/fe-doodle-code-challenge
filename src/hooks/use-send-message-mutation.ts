"use client";

import { useMutation, useQueryClient, type InfiniteData } from "@tanstack/react-query";

import { createMessage } from "@/lib/api/messages.actions";
import { type CreateMessageInput, type Message, unwrapMessagesResult } from "@/lib/api/messages";

import { messagesQueryKeys } from "./use-messages-query";

export type MessagesCache = InfiniteData<Message[], string | undefined>;

type SendMessageContext = {
  optimisticId: string;
  snapshot: MessagesCache | undefined;
};

export function addOptimisticMessage(
  cache: MessagesCache | undefined,
  message: Message,
): MessagesCache {
  if (!cache) {
    return {
      pageParams: [undefined],
      pages: [[message]],
    };
  }

  const [newestPage = [], ...olderPages] = cache.pages;

  return {
    ...cache,
    pages: [[message, ...newestPage], ...olderPages],
  };
}

export function replaceOptimisticMessage(
  cache: MessagesCache | undefined,
  optimisticId: string,
  confirmedMessage: Message,
) {
  if (!cache) {
    return cache;
  }

  return {
    ...cache,
    pages: cache.pages.map((page) =>
      page.map((message) => (message._id === optimisticId ? confirmedMessage : message)),
    ),
  };
}

export function useSendMessageMutation() {
  const queryClient = useQueryClient();

  return useMutation<Message, Error, CreateMessageInput, SendMessageContext>({
    mutationFn: (input) => createMessage(input).then(unwrapMessagesResult),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: messagesQueryKeys.history() });

      const snapshot = queryClient.getQueryData<MessagesCache>(messagesQueryKeys.history());
      const optimisticId = `optimistic-${crypto.randomUUID()}`;
      const optimisticMessage: Message = {
        _id: optimisticId,
        author: input.author,
        createdAt: new Date().toISOString(),
        message: input.message,
      };

      queryClient.setQueryData<MessagesCache>(
        messagesQueryKeys.history(),
        addOptimisticMessage(snapshot, optimisticMessage),
      );

      return { optimisticId, snapshot };
    },
    onError: (_error, _input, context) => {
      if (context) {
        queryClient.setQueryData(messagesQueryKeys.history(), context.snapshot);
      }
    },
    onSuccess: (confirmedMessage, _input, context) => {
      queryClient.setQueryData<MessagesCache>(messagesQueryKeys.history(), (cache) =>
        replaceOptimisticMessage(cache, context.optimisticId, confirmedMessage),
      );
    },
  });
}

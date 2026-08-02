"use client";

import { useState } from "react";
import { useInfiniteQuery, useMutation, useQueryClient, type InfiniteData } from "@tanstack/react-query";

import { listMessages } from "@/lib/api/messages.actions";
import { MESSAGES_PAGE_SIZE, type Message, unwrapMessagesResult } from "@/lib/api/messages";

export const messagesQueryKeys = {
  all: ["messages"] as const,
  history: () => [...messagesQueryKeys.all, "history"] as const,
};

export function getInitialMessagesCursor(now = new Date()) {
  return now.toISOString();
}

export function mergeMessagePages(pages: Message[][]) {
  const messageIds = new Set<string>();

  return pages
    .flat()
    .filter((message) => {
      if (messageIds.has(message._id)) {
        return false;
      }

      messageIds.add(message._id);
      return true;
    })
    .sort((firstMessage, secondMessage) =>
      firstMessage.createdAt.localeCompare(secondMessage.createdAt),
    );
}

export function getNextMessagesCursor(lastPage: Message[]) {
  if (lastPage.length < MESSAGES_PAGE_SIZE) {
    return undefined;
  }

  return lastPage.reduce((oldestMessage, message) =>
    message.createdAt < oldestMessage.createdAt ? message : oldestMessage,
  ).createdAt;
}

export function getLatestMessagesCursor(messages: Message[]) {
  return messages.at(-1)?.createdAt;
}

export function useMessagesQuery() {
  const [initialBefore] = useState(getInitialMessagesCursor);
  const queryClient = useQueryClient();

  const historyQuery = useInfiniteQuery({
    queryKey: messagesQueryKeys.history(),
    initialPageParam: initialBefore,
    queryFn: ({ pageParam }) =>
      listMessages({
        before: pageParam,
        limit: MESSAGES_PAGE_SIZE,
      }).then(unwrapMessagesResult),
    getNextPageParam: getNextMessagesCursor,
    select: (data) => ({
      ...data,
      messages: mergeMessagePages(data.pages),
    }),
    staleTime: 15_000,
  });

  const newerMessagesMutation = useMutation({
    mutationFn: (after: string) =>
      listMessages({
        after,
        limit: MESSAGES_PAGE_SIZE,
      }).then(unwrapMessagesResult),
    onSuccess: (newerMessages, after) => {
      if (newerMessages.length === 0) {
        return;
      }

      queryClient.setQueryData<InfiniteData<Message[], string>>(
        messagesQueryKeys.history(),
        (cachedHistory) => {
          if (!cachedHistory) {
            return cachedHistory;
          }

          return {
            ...cachedHistory,
            pages: [newerMessages, ...cachedHistory.pages],
            pageParams: [after, ...cachedHistory.pageParams],
          };
        },
      );
    },
  });

  return {
    ...historyQuery,
    fetchNewerMessages: newerMessagesMutation.mutate,
    isFetchNewerMessagesError: newerMessagesMutation.isError,
    isFetchingNewerMessages: newerMessagesMutation.isPending,
  };
}

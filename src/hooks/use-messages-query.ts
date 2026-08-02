"use client";

import { useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";

import {
  listMessages,
  MESSAGES_PAGE_SIZE,
  type Message,
} from "@/lib/api/messages";

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

export function useMessagesQuery(accessToken: string) {
  const [initialBefore] = useState(getInitialMessagesCursor);

  return useInfiniteQuery({
    queryKey: messagesQueryKeys.history(),
    initialPageParam: initialBefore,
    queryFn: ({ pageParam, signal }) =>
      listMessages({
        accessToken,
        before: pageParam,
        limit: MESSAGES_PAGE_SIZE,
        signal,
      }),
    getNextPageParam: getNextMessagesCursor,
    select: (data) => ({
      ...data,
      messages: mergeMessagePages(data.pages),
    }),
    staleTime: 15_000,
  });
}

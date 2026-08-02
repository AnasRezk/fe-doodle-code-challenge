"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

import {
  listMessages,
  MAX_MESSAGES_PAGE_SIZE,
  type Message,
} from "@/lib/api/messages";

export const messagesQueryKeys = {
  all: ["messages"] as const,
  history: () => [...messagesQueryKeys.all, "history"] as const,
};

export function getNextMessagesCursor(lastPage: Message[]) {
  if (lastPage.length < MAX_MESSAGES_PAGE_SIZE) {
    return undefined;
  }

  return lastPage.at(-1)?.createdAt;
}

export function useMessagesQuery(accessToken: string) {
  return useInfiniteQuery({
    queryKey: messagesQueryKeys.history(),
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam, signal }) =>
      listMessages({
        accessToken,
        before: pageParam,
        limit: MAX_MESSAGES_PAGE_SIZE,
        signal,
      }),
    getNextPageParam: getNextMessagesCursor,
    select: (data) => ({
      ...data,
      messages: data.pages.flat(),
    }),
    staleTime: 15_000,
  });
}

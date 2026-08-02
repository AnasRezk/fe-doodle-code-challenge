"use client";

import { useEffect } from "react";

import { QueryProvider } from "@/components/providers/query-provider";
import { useMessagesQuery } from "@/hooks/use-messages-query";

function LoadAllMessages({ accessToken }: { accessToken: string }) {
  const { fetchNextPage, hasNextPage, isFetchingNextPage } = useMessagesQuery(accessToken);

  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  return null;
}

export function MessagesLoader({ accessToken }: { accessToken: string }) {
  return (
    <QueryProvider>
      <LoadAllMessages accessToken={accessToken} />
    </QueryProvider>
  );
}

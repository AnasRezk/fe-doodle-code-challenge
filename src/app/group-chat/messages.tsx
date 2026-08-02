"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

import { MessageBubble } from "@/components/chat/message-bubble";
import { Button } from "@/components/ui/button";
import { getLatestMessagesCursor, useMessagesQuery } from "@/hooks/use-messages-query";

const LOAD_MORE_THRESHOLD = 80;

type PreserveScrollPosition = {
  scrollHeight: number;
  scrollTop: number;
};

function MessageFeed({ username }: { username: string }) {
  const scrollElementRef = useRef<HTMLDivElement>(null);
  const preserveScrollRef = useRef<PreserveScrollPosition | null>(null);
  const hasPositionedInitialPageRef = useRef(false);
  const hasScrolledAwayFromBottomRef = useRef(false);
  const lastRequestedNewerCursorRef = useRef<string | null>(null);
  const wasNearBottomRef = useRef(true);
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isError,
    isFetchNextPageError,
    isFetchNewerMessagesError,
    isFetchingNextPage,
    isFetchingNewerMessages,
    isLoading,
    refetch,
    fetchNewerMessages,
  } = useMessagesQuery();
  const messages = useMemo(() => data?.messages ?? [], [data?.messages]);
  // TanStack Virtual intentionally exposes mutable functions; this component does not memoize them.
  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: messages.length,
    estimateSize: () => 116,
    getItemKey: (index) => messages[index]?._id ?? index,
    getScrollElement: () => scrollElementRef.current,
    overscan: 6,
  });

  useEffect(() => {
    if (isFetchNextPageError) {
      preserveScrollRef.current = null;
    }
  }, [isFetchNextPageError]);

  useEffect(() => {
    if (isFetchNewerMessagesError) {
      lastRequestedNewerCursorRef.current = null;
    }
  }, [isFetchNewerMessagesError]);

  useLayoutEffect(() => {
    const scrollElement = scrollElementRef.current;

    if (!scrollElement || messages.length === 0) {
      return;
    }

    const preservedPosition = preserveScrollRef.current;

    if (preservedPosition) {
      preserveScrollRef.current = null;
      requestAnimationFrame(() => {
        scrollElement.scrollTop =
          preservedPosition.scrollTop + scrollElement.scrollHeight - preservedPosition.scrollHeight;
      });
      return;
    }

    if (!hasPositionedInitialPageRef.current) {
      hasPositionedInitialPageRef.current = true;
      requestAnimationFrame(() => {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      });
      return;
    }

    if (wasNearBottomRef.current) {
      requestAnimationFrame(() => {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      });
    }
  }, [messages.length]);

  const loadOlderMessages = useCallback(() => {
    const scrollElement = scrollElementRef.current;

    if (!scrollElement || !hasNextPage || isFetchingNextPage || preserveScrollRef.current) {
      return;
    }

    preserveScrollRef.current = {
      scrollHeight: scrollElement.scrollHeight,
      scrollTop: scrollElement.scrollTop,
    };

    void fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const loadNewerMessages = useCallback(() => {
    const after = getLatestMessagesCursor(messages);

    if (
      !after ||
      isFetchingNewerMessages ||
      lastRequestedNewerCursorRef.current === after
    ) {
      return;
    }

    lastRequestedNewerCursorRef.current = after;
    hasScrolledAwayFromBottomRef.current = false;
    fetchNewerMessages(after);
  }, [fetchNewerMessages, isFetchingNewerMessages, messages]);

  const handleScroll = useCallback(() => {
    const scrollElement = scrollElementRef.current;

    if (!scrollElement) {
      return;
    }

    const distanceFromBottom =
      scrollElement.scrollHeight - scrollElement.scrollTop - scrollElement.clientHeight;
    wasNearBottomRef.current = distanceFromBottom <= 160;

    if (distanceFromBottom > LOAD_MORE_THRESHOLD) {
      hasScrolledAwayFromBottomRef.current = true;
      lastRequestedNewerCursorRef.current = null;
    }

    if (scrollElement.scrollTop <= LOAD_MORE_THRESHOLD) {
      loadOlderMessages();
    }

    if (hasScrolledAwayFromBottomRef.current && distanceFromBottom <= LOAD_MORE_THRESHOLD) {
      loadNewerMessages();
    }
  }, [loadNewerMessages, loadOlderMessages]);

  return (
    <section aria-labelledby="messages-title" className="relative min-h-0 flex-1">
      <h1 className="sr-only" id="messages-title">
        Group chat messages
      </h1>

      <div
        aria-busy={isLoading || isFetchingNextPage || isFetchingNewerMessages}
        aria-label="Group chat messages"
        aria-live="off"
        className="h-full overflow-y-auto px-4 py-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-600 sm:px-8"
        data-testid="message-feed"
        onScroll={handleScroll}
        ref={scrollElementRef}
        role="log"
        tabIndex={0}
      >
        {isLoading ? (
          <p className="grid min-h-full place-items-center text-sm font-medium text-slate-600" role="status">
            Loading messages…
          </p>
        ) : null}

        {isError && messages.length === 0 ? (
          <div className="grid min-h-full place-items-center text-center" role="alert">
            <div>
              <p className="font-medium text-red-800">Messages could not be loaded.</p>
              <p className="mt-1 text-sm text-slate-600">{error.message}</p>
              <Button className="mt-4" onClick={() => void refetch()}>
                Try again
              </Button>
            </div>
          </div>
        ) : null}

        {!isLoading && !isError && messages.length === 0 ? (
          <p className="grid min-h-full place-items-center text-slate-600">No messages yet.</p>
        ) : null}

        {!isLoading &&
        !isError &&
        messages.length > 0 &&
        !hasNextPage &&
        !isFetchingNextPage &&
        !isFetchNextPageError ? (
          <p
            className="mx-auto mb-3 w-fit rounded-full bg-white/90 px-3 py-1 text-sm font-medium text-slate-500 shadow-sm"
            role="status"
          >
            No more messages
          </p>
        ) : null}

        {messages.length > 0 ? (
          <div className="relative mx-auto w-full max-w-6xl" style={{ height: virtualizer.getTotalSize() }}>
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const message = messages[virtualRow.index];

              if (!message) {
                return null;
              }

              return (
                <div
                  className="absolute left-0 top-0 w-full py-2"
                  data-index={virtualRow.index}
                  key={message._id}
                  ref={virtualizer.measureElement}
                  style={{ transform: `translateY(${virtualRow.start}px)` }}
                >
                  <MessageBubble isMine={message.author === username} message={message} />
                </div>
              );
            })}
          </div>
        ) : null}
      </div>

      {isFetchingNextPage ? (
        <p
          className="pointer-events-none absolute left-1/2 top-3 z-10 -translate-x-1/2 rounded-full bg-white px-3 py-1 text-sm font-medium text-slate-600 shadow"
          role="status"
        >
          Loading older messages…
        </p>
      ) : null}

      {isFetchNextPageError ? (
        <div
          className="absolute left-1/2 top-3 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full bg-white px-3 py-1 text-sm text-red-800 shadow"
          role="alert"
        >
          <span>Older messages could not be loaded.</span>
          <Button className="min-h-8 px-3 text-xs" onClick={loadOlderMessages}>
            Retry
          </Button>
        </div>
      ) : null}

      {isFetchingNewerMessages ? (
        <p
          className="pointer-events-none absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-white px-3 py-1 text-sm font-medium text-slate-600 shadow"
          role="status"
        >
          Checking for new messages…
        </p>
      ) : null}

      {isFetchNewerMessagesError ? (
        <div
          className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full bg-white px-3 py-1 text-sm text-red-800 shadow"
          role="alert"
        >
          <span>New messages could not be loaded.</span>
          <Button className="min-h-8 px-3 text-xs" onClick={loadNewerMessages}>
            Retry
          </Button>
        </div>
      ) : null}
    </section>
  );
}

export function Messages({ username }: { username: string }) {
  return <MessageFeed username={username} />;
}

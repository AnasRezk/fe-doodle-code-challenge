import type { Message } from "@/lib/api/messages";
import { formatMessageTimestamp } from "@/lib/messages/format-message-timestamp";
import { cn } from "@/lib/utils";

export function MessageBubble({ isMine, message }: { isMine: boolean; message: Message }) {
  return (
    <article
      aria-label={`${isMine ? "You" : message.author} at ${formatMessageTimestamp(message.createdAt)}`}
      className={cn(
        "w-fit max-w-[85%] rounded-md border border-slate-300 px-4 py-3 text-slate-700 shadow-sm sm:max-w-xl sm:px-5",
        isMine ? "ml-auto bg-[#fff8bf]" : "bg-white",
      )}
    >
      <p className="text-sm font-medium text-slate-400">{isMine ? "You" : message.author}</p>
      <p className="mt-1 whitespace-pre-wrap break-words text-lg leading-7">{message.message}</p>
      <time
        className={cn("mt-1 block text-sm text-slate-400", isMine && "text-right")}
        dateTime={message.createdAt}
      >
        {formatMessageTimestamp(message.createdAt)}
      </time>
    </article>
  );
}

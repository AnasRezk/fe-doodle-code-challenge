"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSendMessageMutation } from "@/hooks/use-send-message-mutation";

export function MessageComposer({ username }: { username: string }) {
  const [message, setMessage] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const wasSendingRef = useRef(false);
  const sendMessage = useSendMessageMutation();
  const normalizedMessage = message.trim();

  useEffect(() => {
    if (sendMessage.isPending) {
      wasSendingRef.current = true;
      return;
    }

    if (wasSendingRef.current) {
      wasSendingRef.current = false;
      inputRef.current?.focus();
    }
  }, [sendMessage.isPending]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!normalizedMessage || sendMessage.isPending) {
      return;
    }

    const submittedMessage = normalizedMessage;
    setMessage("");
    setAnnouncement("");

    sendMessage.mutate(
      { author: username, message: submittedMessage },
      {
        onError: () => {
          setMessage((currentMessage) => currentMessage || submittedMessage);
          setAnnouncement("Message could not be sent. Your text has been restored.");
        },
        onSuccess: () => {
          setAnnouncement("Message sent.");
        },
      },
    );
  };

  return (
    <footer className="shrink-0 bg-[#389bd0] p-3 sm:p-4">
      <form className="mx-auto flex w-full max-w-6xl items-stretch gap-3" onSubmit={handleSubmit}>
        <label className="sr-only" htmlFor="message">
          Message
        </label>
        <Input
          autoComplete="off"
          className="min-h-12 flex-1 border-2 border-sky-700 text-lg focus-visible:border-sky-800 focus-visible:ring-white/70 sm:min-h-14"
          disabled={sendMessage.isPending}
          id="message"
          maxLength={2000}
          name="message"
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Message"
          ref={inputRef}
          value={message}
        />
        <Button
          className="min-h-12 min-w-24 text-base sm:min-h-14 sm:min-w-32 sm:text-lg"
          disabled={!normalizedMessage || sendMessage.isPending}
          type="submit"
        >
          {sendMessage.isPending ? "Sending…" : "Send"}
        </Button>
      </form>

      <p className="sr-only" role="status">
        {announcement}
      </p>
    </footer>
  );
}

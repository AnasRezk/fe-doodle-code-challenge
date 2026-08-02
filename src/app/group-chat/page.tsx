import type { Metadata } from "next";
import { cookies } from "next/headers";

import bodyBackground from "../../../assets/Body BG.png";

import { QueryProvider } from "@/components/providers/query-provider";
import { USERNAME_COOKIE } from "@/lib/auth/cookies";

import { MessageComposer } from "./message-composer";
import { Messages } from "./messages";

export const metadata: Metadata = {
  title: "Group chat | Doodle Chat",
};

export default async function GroupChatPage() {
  const cookieStore = await cookies();
  // The proxy guarantees this cookie before this protected route is rendered.
  const username = cookieStore.get(USERNAME_COOKIE)!.value.trim();

  return (
    <main
      className="flex h-dvh flex-col bg-white bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url("${bodyBackground.src}")` }}
    >
      <QueryProvider>
        <Messages username={username} />
        <MessageComposer username={username} />
      </QueryProvider>
    </main>
  );
}

import type { Metadata } from "next";
import { cookies } from "next/headers";

import { ACCESS_TOKEN_COOKIE, USERNAME_COOKIE } from "@/lib/auth/cookies";

import { MessagesLoader } from "./messages-loader";

export const metadata: Metadata = {
  title: "Group chat | Doodle Chat",
};

export default async function GroupChatPage() {
  const cookieStore = await cookies();
  // The proxy guarantees both cookies before this protected route is rendered.
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)!.value.trim();
  const username = cookieStore.get(USERNAME_COOKIE)!.value.trim();

  return (
    <>
      <MessagesLoader accessToken={accessToken} />
      <main className="grid min-h-dvh place-items-center bg-slate-50 p-6">
        <section className="text-center" aria-labelledby="group-chat-title">
          <p className="text-sm font-semibold text-sky-600">Signed in as {username}</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-800" id="group-chat-title">
            Group chat
          </h1>
          <p className="mt-3 text-slate-600">The conversation interface is ready to be added.</p>
        </section>
      </main>
    </>
  );
}

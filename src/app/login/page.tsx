import type { Metadata } from "next";

import bodyBackground from "../../../assets/Body BG.png";

import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Log in | Doodle Chat",
};

export default function LoginPage() {
  return (
    <main
      className="grid min-h-dvh place-items-center bg-slate-50 bg-repeat p-4 sm:p-8"
      style={{ backgroundImage: `linear-gradient(rgb(255 255 255 / 82%), rgb(255 255 255 / 82%)), url(${bodyBackground.src})` }}
    >
      <section
        aria-labelledby="login-title"
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/10 sm:p-10"
      >
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-sky-600">Doodle Chat</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-800" id="login-title">
          Join the conversation
        </h1>
        <p className="mt-3 leading-7 text-slate-600">
          Choose a username to enter the group chat. No password is needed for this demo.
        </p>

        <LoginForm />
      </section>
    </main>
  );
}

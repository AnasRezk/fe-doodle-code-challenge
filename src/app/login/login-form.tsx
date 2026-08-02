"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { login, type LoginState } from "./actions";

const initialState: LoginState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button className="w-full" disabled={pending} type="submit">
      {pending ? "Joining…" : "Join the chat"}
    </Button>
  );
}

export function LoginForm() {
  const [state, action] = useActionState(login, initialState);

  return (
    <form action={action} className="mt-8 space-y-5" noValidate>
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slate-700" htmlFor="username">
          Username
        </label>
        <Input
          aria-describedby={state.error ? "username-error" : "username-hint"}
          aria-invalid={Boolean(state.error)}
          autoComplete="username"
          autoFocus
          id="username"
          maxLength={50}
          minLength={2}
          name="username"
          placeholder="How should we call you?"
          required
        />
        <p className="text-sm text-slate-500" id="username-hint">
          This name will be shown beside your messages.
        </p>
        {state.error ? (
          <p className="text-sm font-medium text-red-700" id="username-error" role="alert">
            {state.error}
          </p>
        ) : null}
      </div>

      <SubmitButton />
    </form>
  );
}

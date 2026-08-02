const MIN_USERNAME_LENGTH = 2;
const MAX_USERNAME_LENGTH = 50;

export type UsernameResult =
  | { username: string; error?: never }
  | { username?: never; error: string };

export function validateUsername(value: FormDataEntryValue | null): UsernameResult {
  if (typeof value !== "string") {
    return { error: "Enter a username to continue." };
  }

  const username = value.trim().replace(/\s+/g, " ");

  if (username.length < MIN_USERNAME_LENGTH) {
    return { error: "Username must contain at least 2 characters." };
  }

  if (username.length > MAX_USERNAME_LENGTH) {
    return { error: "Username must contain no more than 50 characters." };
  }

  return { username };
}

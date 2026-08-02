import { describe, expect, it } from "vitest";

import { validateUsername } from "./username";

describe("validateUsername", () => {
  it("normalizes a valid display name", () => {
    expect(validateUsername("  Ada   Lovelace  ")).toEqual({ username: "Ada Lovelace" });
  });

  it("rejects a display name that is too short", () => {
    expect(validateUsername(" A ")).toEqual({
      error: "Username must contain at least 2 characters.",
    });
  });

  it("rejects non-string form data", () => {
    expect(validateUsername(null)).toEqual({ error: "Enter a username to continue." });
  });
});

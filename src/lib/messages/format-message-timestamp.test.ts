import { describe, expect, it } from "vitest";

import { formatMessageTimestamp } from "./format-message-timestamp";

describe("formatMessageTimestamp", () => {
  it("formats an API timestamp consistently", () => {
    expect(formatMessageTimestamp("2024-01-12T10:30:00Z")).toBe("12 Jan 2024 10:30");
  });

  it("handles an invalid timestamp", () => {
    expect(formatMessageTimestamp("not-a-date")).toBe("Unknown time");
  });
});

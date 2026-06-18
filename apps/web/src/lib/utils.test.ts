import { describe, expect, it } from "vitest";

import { cn, formatErrorMessage } from "@/lib/utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });
});

describe("formatErrorMessage", () => {
  it("extracts Error message", () => {
    expect(formatErrorMessage(new Error("boom"))).toBe("boom");
  });

  it("avoids [object Event] for DOM events", () => {
    const event = new Event("error");
    expect(formatErrorMessage(event)).toBe("Something went wrong");
    expect(String(event)).toBe("[object Event]");
  });
});

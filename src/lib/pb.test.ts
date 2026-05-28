import { describe, expect, it } from "vitest";
import { pb } from "./pb";

describe("PocketBase client", () => {
  it("keeps duplicate parallel writes from cancelling each other", () => {
    expect(
      (pb as unknown as { enableAutoCancellation: boolean })
        .enableAutoCancellation,
    ).toBe(false);
  });
});

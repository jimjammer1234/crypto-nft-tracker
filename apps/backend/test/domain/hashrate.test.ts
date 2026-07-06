import { describe, it, expect } from "vitest";
import { parseHashrateString } from "../../src/utils/hashrate.js";

describe("parseHashrateString", () => {
  it("parses ckpool-style suffixes (no Hs)", () => {
    expect(parseHashrateString("223T")).toBe(223e12);
    expect(parseHashrateString("1.44P")).toBe(1.44e15);
    expect(parseHashrateString("6.63T")).toBe(6.63e12);
  });

  it("parses kano-style suffixes (with Hs)", () => {
    expect(parseHashrateString("212.89THs")).toBeCloseTo(212.89e12, -3);
    expect(parseHashrateString("0GHs")).toBe(0);
  });

  it("returns null for missing/unparseable input", () => {
    expect(parseHashrateString(undefined)).toBeNull();
    expect(parseHashrateString("")).toBeNull();
    expect(parseHashrateString("not-a-hashrate")).toBeNull();
  });
});

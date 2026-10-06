import { describe, it, expect } from "vitest";
import { calculatePrice } from "./pricing";

describe("calculatePrice", () => {
  it("calculates base price plus area for category A without motor", () => {
    const result = calculatePrice({
      widthCm: 400,
      projectionCm: 250,
      fabricCategory: "A",
      motor: false,
    });

    expect(result).toEqual({
      netCents: 130_000,
      vatCents: 24_700,
      grossCents: 154_700,
    });
  });
});

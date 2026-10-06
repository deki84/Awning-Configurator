import { describe, it, expect } from "vitest";
import { calculatePrice } from "./pricing";
import type { AwningConfig } from "./types";

// default config (10 m²), each test overrides only what it needs
function config(overrides: Partial<AwningConfig> = {}): AwningConfig {
  return {
    widthCm: 400,
    projectionCm: 250,
    fabricCategory: "A",
    motor: false,
    ...overrides,
  };
}

describe("calculatePrice", () => {
  describe("base price and fabric", () => {
    it("calculates base price plus area for category A", () => {
      expect(calculatePrice(config())).toEqual({
        netCents: 130_000,
        vatCents: 24_700,
        grossCents: 154_700,
      });
    });

    it("adds 10 % surcharge for category B", () => {
      expect(calculatePrice(config({ fabricCategory: "B" }))).toEqual({
        netCents: 143_000,
        vatCents: 27_170,
        grossCents: 170_170,
      });
    });

    it("adds 20 % surcharge for category C", () => {
      expect(calculatePrice(config({ fabricCategory: "C" }))).toEqual({
        netCents: 156_000,
        vatCents: 29_640,
        grossCents: 185_640,
      });
    });
  });

  describe("motor", () => {
    it("adds 450 € for the motor", () => {
      expect(
        calculatePrice(config({ fabricCategory: "B", motor: true })),
      ).toEqual({ netCents: 188_000, vatCents: 35_720, grossCents: 223_720 });
    });

    it("does not apply the fabric surcharge to the motor", () => {
      const withMotor = calculatePrice(
        config({ fabricCategory: "C", motor: true }),
      );
      const withoutMotor = calculatePrice(config({ fabricCategory: "C" }));
      expect(withMotor.netCents - withoutMotor.netCents).toBe(45_000);
    });
  });

  describe("rounding", () => {
    it("rounds odd sizes to whole cents", () => {
      // 3.33 m * 2.22 m = 7.3926 m² -> 106,533.4 cents -> 106,533
      expect(
        calculatePrice(config({ widthCm: 333, projectionCm: 222 })),
      ).toEqual({ netCents: 106_533, vatCents: 20_241, grossCents: 126_774 });
    });
  });

  describe("validation", () => {
    it("accepts the limits", () => {
      expect(() =>
        calculatePrice(config({ widthCm: 200, projectionCm: 150 })),
      ).not.toThrow();
      expect(() =>
        calculatePrice(config({ widthCm: 700, projectionCm: 400 })),
      ).not.toThrow();
    });

    it.each([199, 701, 0, -100, Number.NaN])("rejects width %s", (widthCm) => {
      expect(() => calculatePrice(config({ widthCm }))).toThrow(RangeError);
    });

    it.each([149, 401])("rejects projection %s", (projectionCm) => {
      expect(() => calculatePrice(config({ projectionCm }))).toThrow(
        RangeError,
      );
    });
  });
});

import type { AwningConfig, FabricCategory, PriceBreakdown } from "./types";

export const LIMITS = {
  minWidthCm: 200,
  maxWidthCm: 700,
  minProjectionCm: 150,
  maxProjectionCm: 400,
} as const;

const BASE_CENTS = 40_000; // 400 €
const PER_SQUARE_METER_CENTS = 9_000; // 90 € per m²
const MOTOR_CENTS = 45_000; // 450 €
const VAT_RATE = 0.19;

// Record forces a value for every category
const FABRIC_SURCHARGE: Record<FabricCategory, number> = {
  A: 0,
  B: 0.1,
  C: 0.2,
};

// Number.isFinite also rejects NaN and Infinity, which would pass < and > checks
function assertInRange(
  value: number,
  min: number,
  max: number,
  field: string,
): void {
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new RangeError(`${field} must be between ${min} and ${max} cm`);
  }
}

export function calculatePrice(config: AwningConfig): PriceBreakdown {
  assertInRange(
    config.widthCm,
    LIMITS.minWidthCm,
    LIMITS.maxWidthCm,
    "widthCm",
  );
  assertInRange(
    config.projectionCm,
    LIMITS.minProjectionCm,
    LIMITS.maxProjectionCm,
    "projectionCm",
  );

  const areaM2 = (config.widthCm / 100) * (config.projectionCm / 100);
  const basePriceCents = Math.round(
    BASE_CENTS + areaM2 * PER_SQUARE_METER_CENTS,
  );

  // fabric surcharge applies to base + area only, not to the motor
  const fabricPriceCents = Math.round(
    basePriceCents * (1 + FABRIC_SURCHARGE[config.fabricCategory]),
  );
  const netCents = fabricPriceCents + (config.motor ? MOTOR_CENTS : 0);

  // round once on the net amount, so gross is always net + vat exactly
  const vatCents = Math.round(netCents * VAT_RATE);

  return { netCents, vatCents, grossCents: netCents + vatCents };
}

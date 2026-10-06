import type { AwningConfig, PriceBreakdown } from "./types";

const BASE_CENTS = 40_000; // 400 €
const PER_SQUARE_METER_CENTS = 9_000; // 90 € per m²
const VAT_RATE = 0.19;

export function calculatePrice(config: AwningConfig): PriceBreakdown {
  // cm -> m, then multiply for the fabric area in m²
  const areaM2 = (config.widthCm / 100) * (config.projectionCm / 100);

  // round to whole cents, odd sizes can produce fractions
  const netCents = Math.round(BASE_CENTS + areaM2 * PER_SQUARE_METER_CENTS);

  // VAT is calculated on net and rounded once
  const vatCents = Math.round(netCents * VAT_RATE);

  return {
    netCents,
    vatCents,
    grossCents: netCents + vatCents,
  };
}

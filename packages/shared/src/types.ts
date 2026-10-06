/** Fabric categories: A = standard, B = premium, C = exclusive */
export type FabricCategory = "A" | "B" | "C";

/** What the customer selects in the configurator */
export interface AwningConfig {
  widthCm: number; // width in centimeters
  projectionCm: number; // how far the awning extends, in centimeters
  fabricCategory: FabricCategory;
  motor: boolean;
}

/**
 * Result of the price calculation, all amounts in CENTS as integers.
 */
export interface PriceBreakdown {
  netCents: number;
  vatCents: number;
  grossCents: number;
}

import {
  pgTable,
  serial,
  integer,
  text,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";

// Beschreibt die Tabelle "orders" in TypeScript.
// Drizzle erzeugt daraus das SQL und die Typen für deine Abfragen.
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  widthCm: integer("width_cm").notNull(),
  projectionCm: integer("projection_cm").notNull(), // ersetzt depthCm, gleicher Name wie in packages/shared
  fabricCategory: text("fabric_category", { enum: ["A", "B", "C"] }).notNull(), // ersetzt fabric
  motor: boolean("motor").notNull().default(false),
  netCents: integer("net_cents").notNull(), // Preise in Cent, wie in packages/shared
  vatCents: integer("vat_cents").notNull(),
  grossCents: integer("gross_cents").notNull(),
  customerEmail: text("customer_email").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

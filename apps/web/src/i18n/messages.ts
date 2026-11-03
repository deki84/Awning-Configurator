// Unterstützte Sprachen
export type Locale = "de" | "en";

export const messages = {
  de: {
    numberLocale: "de-DE",
    title: "Markise konfigurieren",
    width: "Breite",
    projection: "Ausfall",
    fabricCategory: "Stoffkategorie",
    fabricA: "A · Standard",
    fabricB: "B · Premium (+10 %)",
    fabricC: "C · Exklusiv (+20 %)",
    motor: "Elektromotor (+450 € netto)",
    net: "Netto",
    vat: "MwSt. 19 %",
    total: "Gesamt",
  },
  en: {
    numberLocale: "en-IE",
    title: "Configure your awning",
    width: "Width",
    projection: "Projection",
    fabricCategory: "Fabric category",
    fabricA: "A · Standard",
    fabricB: "B · Premium (+10%)",
    fabricC: "C · Exclusive (+20%)",
    motor: "Electric motor (+€450 net)",
    net: "Net",
    vat: "VAT 19%",
    total: "Total",
  },
} satisfies Record<Locale, Record<string, string>>;

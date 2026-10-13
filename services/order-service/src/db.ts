import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { orders } from "./schema.js"; // Tabelle, in die gespeichert wird
import type { NewOrder } from "./app.js"; // Aufbau einer neuen Bestellung

export function createDatabase(databaseUrl: string) {
  // connect_timeout verhindert, dass der Readiness-Check hängen bleibt,
  // wenn die Datenbank nicht erreichbar ist (Wert in Sekunden)
  const client = postgres(databaseUrl, { max: 10, connect_timeout: 5 });
  const db = drizzle(client);

  return {
    db,
    // Einfachste mögliche Abfrage: beweist, dass die Verbindung wirklich funktioniert
    async check() {
      await client`select 1`;
    },
    // Speichert eine Bestellung und gibt die gespeicherte Zeile zurück,
    // inklusive id und createdAt, die die Datenbank selbst vergibt
    async saveOrder(order: NewOrder) {
      const [row] = await db.insert(orders).values(order).returning();
      return row;
    },
    // Schließt alle Verbindungen zur Datenbank, z. B. beim Herunterfahren
    async close() {
      await client.end();
    },
  };
}

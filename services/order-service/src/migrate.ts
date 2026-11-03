import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";

// Fail fast: ohne Datenbank-URL kann nicht migriert werden
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

// Eine einzige Verbindung reicht für die Migration
const client = postgres(databaseUrl, { max: 1 });

try {
  // Führt alle noch nicht angewendeten SQL-Dateien aus dem Ordner "drizzle" aus.
  // Drizzle merkt sich in einer eigenen Tabelle, welche schon gelaufen sind.
  await migrate(drizzle(client), { migrationsFolder: "./drizzle" });
  console.log("Migrations applied");
} finally {
  // Verbindung immer schließen, sonst beendet sich der Prozess nicht
  await client.end();
}

import { buildApp } from "./app.js";
import { createDatabase } from "./db.js";

// Fail fast: a service without a DB URL is misconfigured,
// better to crash on startup than on the first request
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const port = Number(process.env.PORT ?? 4002);
const database = createDatabase(databaseUrl);
const app = buildApp(
  { checkDatabase: database.check, saveOrder: database.saveOrder },
  { logger: true },
);
// Kubernetes sends SIGTERM before stopping a pod.
// Close HTTP first, then the DB pool, so running requests can finish.
for (const signal of ["SIGTERM", "SIGINT"] as const) {
  process.on(signal, async () => {
    await app.close();
    await database.close();
    process.exit(0);
  });
}

try {
  // 0.0.0.0 so the service is reachable from outside its container
  await app.listen({ port, host: "0.0.0.0" });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}

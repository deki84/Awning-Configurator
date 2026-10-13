import { buildApp } from "./app";

const port = Number(process.env.PORT ?? 4001);
const app = buildApp({ logger: true });

// Kubernetes schickt SIGTERM, bevor ein Pod gestoppt wird.
// Erst den Server schließen, damit laufende Anfragen noch fertig werden.
for (const signal of ["SIGTERM", "SIGINT"] as const) {
  process.on(signal, async () => {
    await app.close();
    process.exit(0);
  });
}

// 0.0.0.0 statt localhost, sonst ist der Service im Docker-Container nicht erreichbar
app.listen({ port, host: "0.0.0.0" }).catch((error) => {
  app.log.error(error);
  process.exit(1);
});

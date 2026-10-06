import { buildApp } from "./app";

const port = Number(process.env.PORT ?? 4001);
const app = buildApp({ logger: true });

// 0.0.0.0 instead of localhost, otherwise the service is unreachable inside Docker
app.listen({ port, host: "0.0.0.0" }).catch((error) => {
  app.log.error(error);
  process.exit(1);
});

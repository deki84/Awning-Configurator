import Fastify from "fastify";
import { calculatePrice, type AwningConfig } from "@markise/shared";

// JSON schema: Fastify rejects invalid requests with 400 before our code runs
const awningConfigSchema = {
  type: "object",
  required: ["widthCm", "projectionCm", "fabricCategory", "motor"],
  properties: {
    widthCm: { type: "number" },
    projectionCm: { type: "number" },
    fabricCategory: { type: "string", enum: ["A", "B", "C"] },
    motor: { type: "boolean" },
  },
} as const;

// app is built in a function, so tests can create it without starting a server
export function buildApp(options: { logger?: boolean } = {}) {
  const app = Fastify({ logger: options.logger ?? false });

  // Kubernetes will call this to check if the service is alive
  app.get("/health", async () => ({ status: "ok" }));

  app.post<{ Body: AwningConfig }>(
    "/price",
    { schema: { body: awningConfigSchema } },
    async (request, reply) => {
      try {
        return calculatePrice(request.body);
      } catch (error) {
        // invalid sizes are a client error, not a server error
        if (error instanceof RangeError) {
          return reply.code(400).send({ error: error.message });
        }
        throw error;
      }
    },
  );

  return app;
}

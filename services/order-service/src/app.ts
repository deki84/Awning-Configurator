import Fastify, { type FastifyServerOptions } from "fastify";
import {
  calculatePrice,
  LIMITS,
  type AwningConfig,
  type PriceBreakdown,
} from "@markise/shared";

// Was gespeichert wird: Konfiguration + vom Server berechneter Preis + E-Mail
export interface NewOrder extends AwningConfig, PriceBreakdown {
  customerEmail: string;
}

// Was die Datenbank zurückgibt: zusätzlich id und Zeitstempel
export interface SavedOrder extends NewOrder {
  id: number;
  createdAt: Date;
}

// Alles, was die App von außen braucht.
// Wird übergeben, damit Tests es durch Fakes ersetzen können.
export interface AppDeps {
  checkDatabase: () => Promise<void>;
  saveOrder: (order: NewOrder) => Promise<SavedOrder>;
}

// Was der Client schicken darf. Ein Preis gehört bewusst NICHT dazu.
type CreateOrderBody = AwningConfig & { customerEmail: string };

// Prüfregeln für POST /orders. Die Grenzen kommen aus LIMITS im shared-Paket,
// so gibt es nur eine Stelle, an der die erlaubten Maße festgelegt sind.
const createOrderSchema = {
  body: {
    type: "object",
    required: [
      "widthCm",
      "projectionCm",
      "fabricCategory",
      "motor",
      "customerEmail",
    ],
    additionalProperties: false, // unbekannte Felder (z. B. ein Preis) werden entfernt
    properties: {
      widthCm: {
        type: "integer",
        minimum: LIMITS.minWidthCm,
        maximum: LIMITS.maxWidthCm,
      },
      projectionCm: {
        type: "integer",
        minimum: LIMITS.minProjectionCm,
        maximum: LIMITS.maxProjectionCm,
      },
      fabricCategory: { type: "string", enum: ["A", "B", "C"] },
      motor: { type: "boolean" },
      customerEmail: { type: "string", format: "email", maxLength: 254 },
    },
  },
} as const;

export function buildApp(deps: AppDeps, options: FastifyServerOptions = {}) {
  const app = Fastify(options);

  // Liveness: Kann der Prozess überhaupt noch antworten?
  app.get("/health", async () => ({ status: "ok" }));

  // Readiness: Kann diese Instanz gerade echte Anfragen bearbeiten?
  // 503 sagt Kubernetes, keine Anfragen mehr hierher zu schicken,
  // ohne den Pod neu zu starten.
  app.get("/health/ready", async (request, reply) => {
    try {
      await deps.checkDatabase();
      return { status: "ready" };
    } catch (err) {
      request.log.warn({ err }, "readiness check failed");
      return reply.code(503).send({ status: "unavailable" });
    }
  });

  // Neue Bestellung anlegen
  app.post<{ Body: CreateOrderBody }>(
    "/orders",
    { schema: createOrderSchema },
    async (request, reply) => {
      // Hier kommen nur gültige Daten an, das Schema hat sie bereits geprüft
      const { customerEmail, ...config } = request.body;

      // Den Preis berechnet IMMER der Server. Einem Preis aus dem Browser
      // wird nie vertraut, denn den könnte jeder manipulieren.
      const price = calculatePrice(config);

      const saved = await deps.saveOrder({
        ...config,
        ...price,
        customerEmail,
      });
      return reply.code(201).send(saved); // 201 = Created
    },
  );

  return app;
}

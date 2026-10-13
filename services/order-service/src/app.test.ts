import { describe, it, expect, vi } from "vitest";
import { buildApp, type AppDeps, type NewOrder } from "./app.js";

// Fake-Speicherfunktion: speichert nichts, sondern gibt die Bestellung
// so zurück, wie es die Datenbank tun würde, mit id und Zeitstempel
const fakeSaveOrder = async (order: NewOrder) => ({
  ...order,
  id: 1,
  createdAt: new Date("2026-01-01T00:00:00Z"),
});

// Fakes simulieren eine gesunde oder kaputte Datenbank,
// ohne dass für Unit-Tests ein echtes Postgres laufen muss
const healthyDb: AppDeps = {
  checkDatabase: async () => {},
  saveOrder: fakeSaveOrder,
};
const brokenDb: AppDeps = {
  checkDatabase: async () => {
    throw new Error("connection refused");
  },
  saveOrder: fakeSaveOrder,
};

describe("GET /health (liveness)", () => {
  it("returns 200 with status ok", async () => {
    const app = buildApp(healthyDb);
    const response = await app.inject({ method: "GET", url: "/health" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: "ok" });
    await app.close();
  });

  it("still returns 200 when the database is down", async () => {
    // Restarting the pod would not fix a DB outage,
    // so liveness must not depend on the DB
    const app = buildApp(brokenDb);
    const response = await app.inject({ method: "GET", url: "/health" });

    expect(response.statusCode).toBe(200);
    await app.close();
  });
});

describe("GET /health/ready (readiness)", () => {
  it("returns 200 when the database is reachable", async () => {
    const app = buildApp(healthyDb);
    const response = await app.inject({ method: "GET", url: "/health/ready" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: "ready" });
    await app.close();
  });

  it("returns 503 when the database is unreachable", async () => {
    const app = buildApp(brokenDb);
    const response = await app.inject({ method: "GET", url: "/health/ready" });

    expect(response.statusCode).toBe(503);
    expect(response.json()).toEqual({ status: "unavailable" });
    await app.close();
  });
});
describe("POST /orders", () => {
  // Gültige Beispielbestellung: 4 m breit, 2,5 m Ausladung, Stoff A, ohne Motor
  const validOrder = {
    widthCm: 400,
    projectionCm: 250,
    fabricCategory: "A",
    motor: false,
    customerEmail: "kunde@example.com",
  };

  // Baut die App mit einer Fake-Speicherfunktion, die mitschreibt,
  // womit sie aufgerufen wurde
  function makeApp() {
    const saveOrder = vi.fn(fakeSaveOrder);
    const app = buildApp({ ...healthyDb, saveOrder });
    return { app, saveOrder };
  }

  it("speichert die Bestellung mit dem vom Server berechneten Preis", async () => {
    const { app, saveOrder } = makeApp();

    const response = await app.inject({
      method: "POST",
      url: "/orders",
      payload: validOrder,
    });

    expect(response.statusCode).toBe(201);
    // 4 m × 2,5 m = 10 m² → 400 € + 10 × 90 € = 1.300 € netto, dazu 19 % MwSt.
    expect(saveOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        netCents: 130_000,
        vatCents: 24_700,
        grossCents: 154_700,
      }),
    );
    await app.close();
  });

  it("ignoriert einen Preis, den der Client mitschickt", async () => {
    const { app, saveOrder } = makeApp();

    await app.inject({
      method: "POST",
      url: "/orders",
      payload: { ...validOrder, grossCents: 1 }, // Manipulationsversuch
    });

    // Gespeichert wird trotzdem der richtige Preis
    expect(saveOrder).toHaveBeenCalledWith(
      expect.objectContaining({ grossCents: 154_700 }),
    );
    await app.close();
  });

  it("lehnt eine zu kleine Breite mit 400 ab und speichert nichts", async () => {
    const { app, saveOrder } = makeApp();

    const response = await app.inject({
      method: "POST",
      url: "/orders",
      payload: { ...validOrder, widthCm: 50 },
    });

    expect(response.statusCode).toBe(400);
    expect(saveOrder).not.toHaveBeenCalled();
    await app.close();
  });
});

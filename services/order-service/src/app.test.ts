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

import { describe, it, expect, afterAll } from "vitest";
import { buildApp } from "./app";

const app = buildApp();
afterAll(() => app.close());

describe("product-service", () => {
  it("GET /health returns ok", async () => {
    const response = await app.inject({ method: "GET", url: "/health" });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: "ok" });
  });

  it("POST /price returns the calculated price", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/price",
      payload: {
        widthCm: 400,
        projectionCm: 250,
        fabricCategory: "A",
        motor: false,
      },
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      netCents: 130_000,
      vatCents: 24_700,
      grossCents: 154_700,
    });
  });

  it("POST /price returns 400 for an invalid width", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/price",
      payload: {
        widthCm: 50,
        projectionCm: 250,
        fabricCategory: "A",
        motor: false,
      },
    });
    expect(response.statusCode).toBe(400);
  });

  it("POST /price returns 400 for a missing field", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/price",
      payload: { widthCm: 400 },
    });
    expect(response.statusCode).toBe(400);
  });
});

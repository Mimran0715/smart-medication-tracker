import { expect, test } from "@playwright/test";

test("glucose API rejects a request with missing fields", async ({ request }) => {
  const response = await request.post("/api/glucose", {
    data: { type: "glucose", value: 120 },
  });

  expect(response.status()).toBe(400);
  expect(await response.json()).toEqual({ error: "Missing fields" });
});

test("medication API rejects a request with missing fields", async ({ request }) => {
  const response = await request.post("/api/medication", {
    data: { medication: "Metformin", dose: 500, unit: "mg" },
  });

  expect(response.status()).toBe(400);
  expect(await response.json()).toEqual({ error: "Missing fields" });
});

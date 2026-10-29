import { expect, test } from "@playwright/test";
import { openMockedDashboard } from "./helpers";

test("dashboard loads glucose data into the glucose chart", async ({ page }) => {
  const glucose = [{ reading: 101 }, { reading: 125 }];
  const glucoseResponse = page.waitForResponse("**/api/dashboard/glucose");

  await openMockedDashboard(page, { glucose });

  expect(await (await glucoseResponse).json()).toEqual(glucose);
  const glucoseCard = page.getByRole("heading", { name: "Glucose Levels" }).locator("..");
  await expect(glucoseCard.locator("canvas")).toBeVisible();
});

test("dashboard loads side-effect data into the side-effects chart", async ({ page }) => {
  const sideEffects = [
    { date: "2026-10-29", side_effect_category: "nausea", occurrences: 2 },
  ];
  const sideEffectsResponse = page.waitForResponse("**/api/dashboard/side-effects");

  await openMockedDashboard(page, { sideEffects });

  expect(await (await sideEffectsResponse).json()).toEqual(sideEffects);
  const sideEffectsCard = page.getByRole("heading", { name: "Side Effects" }).locator("..");
  await expect(sideEffectsCard.locator("canvas")).toBeVisible();
});

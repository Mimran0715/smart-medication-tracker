import { expect, test } from "@playwright/test";
import { openMockedDashboard } from "./helpers";

test("redirects a signed-out user to login", async ({ page }) => {
  await page.goto("/dashboard");

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Login" })).toBeVisible();
});

test("a patient can submit a glucose reading", async ({ page }) => {
  let submittedGlucose: number | undefined;
  await page.route("**/api/quick-actions", async (route) => {
    submittedGlucose = (await route.request().postDataJSON()).glucose;
    await route.fulfill({ json: { success: true } });
  });
  await openMockedDashboard(page);

  await page.getByRole("button", { name: "Log Glucose" }).click();
  await page.getByLabel("Glucose (mg/dL)").fill("125");
  await page.getByLabel("Date & Time").fill("2026-10-25T08:30");
  await page.getByRole("button", { name: "Save", exact: true }).click();

  await expect(page.getByRole("heading", { name: "Log Glucose" })).toBeHidden();
  expect(submittedGlucose).toBe(125);
});

import { expect, test } from "@playwright/test";
import { openMockedDashboard } from "./helpers";

test.beforeEach(async ({ page }) => {
  await openMockedDashboard(page);
});

test("does not allow duplicate medication times", async ({ page }) => {
  const schedule = page
    .getByRole("heading", { name: "Medication Schedule" })
    .locator("../..");
  await schedule.getByRole("button", { name: "Edit" }).first().click();
  await page.getByRole("button", { name: "+ Add Time" }).click();

  const times = page.locator('input[type="time"]');
  await times.nth(1).fill(await times.nth(0).inputValue());
  await page.getByRole("button", { name: "Save Schedule" }).click();

  await expect(page.getByText("Duplicate times are not allowed")).toBeVisible();
});

test("saves an edited medication dosage", async ({ page }) => {
  const medications = page.getByRole("heading", { name: "Medications" }).locator("..");
  await medications.getByRole("button", { name: "Edit" }).first().click();
  await page.getByRole("textbox").fill("Take with breakfast");
  await page.getByRole("button", { name: "Save", exact: true }).click();

  await expect(medications.getByText("Take with breakfast")).toBeVisible();
});

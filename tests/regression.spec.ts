import { expect, test } from "@playwright/test";
import { openMockedDashboard } from "./helpers";

test("home page opens the login screen", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Login" })).toBeVisible();
});

test("login page can switch to sign up", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Sign up" }).click();

  await expect(page.getByRole("heading", { name: "Create Account" })).toBeVisible();
});

test("dashboard shows its main sections", async ({ page }) => {
  await openMockedDashboard(page);

  await expect(page.getByRole("heading", { name: "Glucose Levels" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Medication Schedule" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Medications" })).toBeVisible();
});

import { Page } from "@playwright/test";

export async function openMockedDashboard(page: Page) {
  await page.context().addCookies([
    { name: "__session", value: "test-session", url: "http://127.0.0.1:3000" },
  ]);

  await page.route("**/api/dashboard/glucose", (route) =>
    route.fulfill({ json: [{ reading: 110 }, { reading: 118 }] })
  );
  await page.route("**/api/dashboard/side-effects", (route) =>
    route.fulfill({ json: [] })
  );
  await page.route("**/api/dashboard/adherence", (route) =>
    route.fulfill({ json: [{ adherence: 87 }] })
  );
  await page.route("**/api/notifications", (route) =>
    route.fulfill({ json: [] })
  );
  await page.route("**/api/cron/send-reminders", (route) =>
    route.fulfill({ json: { sent: 0, skipped: 0, failed: 0 } })
  );

  await page.goto("/dashboard");
  await page.getByRole("heading", { name: "Quick Actions" }).waitFor();
}

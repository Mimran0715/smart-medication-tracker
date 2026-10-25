import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:3000/login",
    reuseExistingServer: true,
    env: {
      ...process.env,
      NEXT_PUBLIC_FIREBASE_API_KEY: "test-api-key",
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "localhost",
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: "test-project",
      NEXT_PUBLIC_FIREBASE_APP_ID: "test-app-id",
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});

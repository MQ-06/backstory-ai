import { defineConfig, devices } from "@playwright/test";

const webUrl = process.env.WEB_URL ?? "http://localhost:3000";
const apiUrl = process.env.API_URL ?? "http://localhost:8000";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: webUrl,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: process.env.CI
    ? undefined
    : [
        {
          command: "pnpm dev:api",
          url: `${apiUrl}/health`,
          reuseExistingServer: true,
          cwd: "..",
        },
        {
          command: "pnpm dev:web",
          url: webUrl,
          reuseExistingServer: true,
          cwd: "..",
        },
      ],
});

import { defineConfig, devices } from "@playwright/test";

const webUrl = process.env.WEB_URL ?? "http://127.0.0.1:3000";
const apiUrl = process.env.API_URL ?? "http://127.0.0.1:8000";
const ci = Boolean(process.env.CI);

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: ci,
  retries: ci ? 1 : 0,
  workers: ci ? 1 : undefined,
  reporter: ci ? "github" : "list",
  timeout: ci ? 60_000 : 30_000,
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
  webServer: ci
    ? [
        {
          command: "uv run alembic upgrade head && uv run uvicorn app.main:app --host 127.0.0.1 --port 8000",
          url: `${apiUrl}/health`,
          reuseExistingServer: false,
          timeout: 120_000,
          cwd: "../apps/api",
          env: {
            ...process.env,
            DATABASE_URL:
              process.env.DATABASE_URL ??
              "postgresql+asyncpg://backstory:backstory@localhost:5432/backstory",
            REDIS_URL: process.env.REDIS_URL ?? "redis://localhost:6379/0",
          },
        },
        {
          command: "pnpm --filter web exec next build && pnpm --filter web exec next start -p 3000 -H 127.0.0.1",
          url: webUrl,
          reuseExistingServer: false,
          timeout: 180_000,
          cwd: "..",
        },
      ]
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

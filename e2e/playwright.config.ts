import { defineConfig, devices } from "@playwright/test";

const ci = Boolean(process.env.CI);
/** Local E2E API on :8001 so it does not clash with `make dev` on :8000. */
const apiPort = ci ? 8000 : 8001;
/** Local E2E web on :3002 so Playwright never reuses `make dev` on :3000. */
const webPort = ci ? 3000 : 3002;
const webHost = ci ? "127.0.0.1" : "localhost";
const webUrl = process.env.WEB_URL ?? `http://${webHost}:${webPort}`;
const apiUrl = process.env.API_URL ?? `http://127.0.0.1:${apiPort}`;

if (!process.env.API_URL) {
  process.env.API_URL = apiUrl;
}
if (!process.env.WEB_URL) {
  process.env.WEB_URL = webUrl;
}

const apiEnv = {
  ...process.env,
  E2E_TEST_MODE: "1",
  NEXT_PUBLIC_API_URL: apiUrl,
  DATABASE_URL:
    process.env.DATABASE_URL ??
    (ci
      ? "postgresql+asyncpg://backstory:backstory@localhost:5432/backstory"
      : "postgresql+asyncpg://backstory:backstory@localhost:5433/backstory"),
  REDIS_URL: process.env.REDIS_URL ?? (ci ? "redis://localhost:6379/0" : "redis://localhost:6380/0"),
};

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  forbidOnly: ci,
  retries: 2,
  workers: 1,
  reporter: ci ? "github" : "list",
  timeout: ci ? 60_000 : 45_000,
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
          command:
            "uv run alembic upgrade head && uv run uvicorn app.main:app --host 127.0.0.1 --port 8000",
          url: `${apiUrl}/health`,
          reuseExistingServer: false,
          timeout: 120_000,
          cwd: "../apps/api",
          env: apiEnv,
        },
        {
          command: `pnpm --filter web exec next build && pnpm --filter web exec next start -p ${webPort} -H 127.0.0.1`,
          url: webUrl,
          reuseExistingServer: false,
          timeout: 180_000,
          cwd: "..",
        },
      ]
    : [
        {
          command: `uv run uvicorn app.main:app --host 127.0.0.1 --port ${apiPort}`,
          url: `${apiUrl}/health`,
          reuseExistingServer: false,
          timeout: 120_000,
          cwd: "../apps/api",
          env: apiEnv,
        },
        {
          command: `rm -rf ../apps/web/.next-e2e && NEXT_DIST_DIR=.next-e2e NEXT_PUBLIC_API_URL=${apiUrl} pnpm --filter web exec next dev -p ${webPort}`,
          url: `${webUrl}/sign-in`,
          reuseExistingServer: false,
          timeout: 180_000,
          cwd: "..",
        },
      ],
});

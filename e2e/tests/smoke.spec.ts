import { test, expect, type Page, type Response } from "@playwright/test";

const apiUrl = process.env.API_URL ?? "http://127.0.0.1:8001";

/** Retry navigation — avoids flaky net::ERR_NETWORK_CHANGED when dev server compiles. */
async function gotoStable(page: Page, url: string): Promise<Response | null> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 });
    } catch (error) {
      lastError = error;
      await page.waitForTimeout(1500);
    }
  }
  throw lastError;
}

test.describe("API smoke", () => {
  test("health endpoint returns ok", async ({ request }) => {
    const response = await request.get(`${apiUrl}/health`);
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.status).toBe("ok");
  });

  test("ask endpoint requires auth", async ({ request }) => {
    const engagementId = "00000000-0000-0000-0000-000000000001";
    const response = await request.post(`${apiUrl}/api/v1/engagements/${engagementId}/ask`, {
      data: { question: "Why does payroll fail on month-end?" },
    });
    expect(response.status()).toBe(401);
  });
});

test.describe("Web smoke", () => {
  test("sign-in page loads", async ({ page }) => {
    const response = await gotoStable(page, "/sign-in");
    expect(response?.status() ?? 200).toBeLessThan(500);
    await expect(page).toHaveURL(/sign-in/);
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
    await expect(page.getByText("Runtime Error")).toHaveCount(0);
  });

  test("marketing home loads", async ({ page }) => {
    const response = await gotoStable(page, "/");
    expect(response?.status() ?? 200).toBeLessThan(500);
    await expect(page.locator("body")).toBeVisible();
  });

  test("ask route redirects unauthenticated users to sign-in", async ({ page }) => {
    await gotoStable(page, "/ask");
    await expect(page).toHaveURL(/sign-in/);
  });
});

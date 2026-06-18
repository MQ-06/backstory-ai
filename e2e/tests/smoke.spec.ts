import { test, expect } from "@playwright/test";

const apiUrl = process.env.API_URL ?? "http://localhost:8000";

test.describe("API smoke", () => {
  test("health endpoint returns ok", async ({ request }) => {
    const response = await request.get(`${apiUrl}/health`);
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.status).toBe("ok");
  });
});

test.describe("Web smoke", () => {
  test("sign-in page loads", async ({ page }) => {
    test.skip(Boolean(process.env.CI), "Web dev server not started in CI e2e job");
    await page.goto("/sign-in");
    await expect(page).toHaveURL(/sign-in/);
    await expect(page.locator("body")).toBeVisible();
  });

  test("home redirects or loads", async ({ page }) => {
    test.skip(Boolean(process.env.CI), "Web dev server not started in CI e2e job");
    const response = await page.goto("/");
    expect(response?.status()).toBeLessThan(500);
  });
});

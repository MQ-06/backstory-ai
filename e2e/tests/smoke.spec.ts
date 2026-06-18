import { test, expect } from "@playwright/test";

const apiUrl = process.env.API_URL ?? "http://localhost:8000";

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
    await page.goto("/sign-in");
    await expect(page).toHaveURL(/sign-in/);
    await expect(page.locator("body")).toBeVisible();
  });

  test("marketing home loads", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBeLessThan(500);
    await expect(page.locator("body")).toBeVisible();
  });

  test("ask route redirects unauthenticated users to sign-in", async ({ page }) => {
    await page.goto("/ask");
    await expect(page).toHaveURL(/sign-in/);
  });
});

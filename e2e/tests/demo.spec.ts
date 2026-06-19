import { test, expect } from "@playwright/test";

const apiUrl = process.env.API_URL ?? "http://localhost:8000";
const e2eOrgId = `org_e2e_${Date.now()}`;

const e2eHeaders = {
  "X-E2E-Org-Id": e2eOrgId,
  "X-E2E-User-Id": "e2e_demo_user",
  "Content-Type": "application/json",
};

test.describe("Demo API path", () => {
  test.skip(!process.env.E2E_TEST_MODE && !process.env.CI, "Requires E2E_TEST_MODE=1 or CI");

  let engagementId: string;

  test.beforeAll(async ({ request }) => {
    const engRes = await request.post(`${apiUrl}/api/v1/engagements`, {
      headers: e2eHeaders,
      data: { name: "E2E Payroll Demo" },
    });
    expect(engRes.ok()).toBeTruthy();
    const eng = await engRes.json();
    engagementId = eng.id;
    // Do not POST a git source here — fake repo URLs enqueue worker ingest and spam logs.
  });

  test("brief generation returns signals or honest empty state", async ({ request }) => {
    const res = await request.post(`${apiUrl}/api/v1/engagements/${engagementId}/briefs`, {
      headers: e2eHeaders,
      data: { expert_name: "Ahmed", module_path: "payroll" },
    });
    expect([201, 503]).toContain(res.status());
    if (res.status() === 201) {
      const brief = await res.json();
      expect(brief).toHaveProperty("status");
      expect(Array.isArray(brief.questions)).toBeTruthy();
    }
  });

  test("ask requires question body", async ({ request }) => {
    const res = await request.post(`${apiUrl}/api/v1/engagements/${engagementId}/ask`, {
      headers: e2eHeaders,
      data: { question: "Why does payroll fail on month-end?" },
    });
    // SSE or JSON — should not be 401 with E2E headers
    expect(res.status()).not.toBe(401);
  });

  test("library endpoint returns artifact list", async ({ request }) => {
    const res = await request.get(`${apiUrl}/api/v1/engagements/${engagementId}/library`, {
      headers: e2eHeaders,
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toHaveProperty("artifacts");
    expect(body).toHaveProperty("summary");
  });
});

test.describe("Refusal UI copy", () => {
  test("marketing mentions honest refusal", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded", timeout: 30_000 });
    const body = await page.locator("body").innerText();
    expect(body.toLowerCase()).toMatch(/refus|don't have|citation|receipt/i);
  });
});

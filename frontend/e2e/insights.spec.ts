import { expect, test } from "@playwright/test";

const HR_EMAIL = "hr@incubyte.co";
const HR_PASSWORD = "password123";

test.describe("Insights Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email address").fill(HR_EMAIL);
    await page.getByLabel("Password").fill(HR_PASSWORD);
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL("/");
    await page.goto("/insights");
  });

  test("insights page shows KPI cards and charts", async ({ page }) => {
    // Wait for data to load (KPI cards have loading skeletons)
    await expect(page.getByText(/active headcount/i)).toBeVisible({ timeout: 8000 });
    await expect(page.getByText(/total annual payroll/i)).toBeVisible();
    await expect(page.getByText(/median compensation/i)).toBeVisible();
    await expect(page.getByText(/reviews due/i)).toBeVisible();
  });

  test("department compensation chart is visible", async ({ page }) => {
    await expect(page.getByText(/avg compensation by department/i)).toBeVisible({ timeout: 8000 });
    await expect(page.getByText(/workforce by status/i)).toBeVisible();
  });

  test("top earners shows ranked list", async ({ page }) => {
    await expect(page.getByText(/top 10 earners/i)).toBeVisible({ timeout: 8000 });
    // Wait for data and check for rank #1
    await page.waitForTimeout(1500);
    await expect(page.getByText("#1", { exact: true })).toBeVisible();
  });

  test("employment type mix chart is visible", async ({ page }) => {
    await expect(page.getByText(/employment type mix/i)).toBeVisible({ timeout: 8000 });
    await expect(page.getByText(/headcount by department/i)).toBeVisible();
  });

  test("analytics nav link is active on insights page", async ({ page }) => {
    const analyticsLink = page.getByRole("link", { name: "Analytics" });
    await expect(analyticsLink).toHaveClass(/blue/);
  });
});

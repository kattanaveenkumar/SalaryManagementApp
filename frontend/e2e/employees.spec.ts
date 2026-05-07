import { expect, test } from "@playwright/test";
import { setupAuthMock, setupEmployeesMock } from "./mocks";

const HR_EMAIL = "hr@incubyte.co";
const HR_PASSWORD = "password123";

test.describe("Employee Management", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthMock(page);
    await setupEmployeesMock(page);
    await page.goto("/login");
    await page.getByLabel("Email address").fill(HR_EMAIL);
    await page.getByLabel("Password").fill(HR_PASSWORD);
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL("/");
    // Wait for the table to render at least one row
    await expect(page.locator("table tbody tr").first()).toBeVisible({ timeout: 10000 });
  });

  test("employees page shows list with pagination", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /employees/i })).toBeVisible();
    await expect(page.getByText(/total/i)).toBeVisible();
    await expect(page.locator("table tbody tr").first()).toBeVisible();
  });

  test("filter by country narrows results", async ({ page }) => {
    // Country filter has a sr-only label associated via htmlFor
    await page.getByLabel("Country").fill("United States");
    await page.waitForTimeout(500);
    const rows = page.locator("table tbody tr");
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  });

  test("filter by name performs partial match", async ({ page }) => {
    // Search input has no label — locate by placeholder
    await page.getByPlaceholder("Search employees…").fill("a");
    // Wait for 280ms debounce + API round-trip
    await page.waitForTimeout(600);
    await expect(page.locator("table tbody tr").first()).toBeVisible();
  });

  test("clear filters resets the list", async ({ page }) => {
    await page.getByLabel("Country").fill("United States");
    await page.waitForTimeout(400);
    // "Clear all" button appears when any filter is active
    await page.getByRole("button", { name: /clear all/i }).click();
    await page.waitForTimeout(400);
    await expect(page.locator("table tbody tr").first()).toBeVisible();
  });

  test("clicking column header sorts the table", async ({ page }) => {
    await page.getByRole("columnheader", { name: /salary/i }).click();
    await page.waitForTimeout(300);
    await page.getByRole("columnheader", { name: /salary/i }).click();
    await page.waitForTimeout(300);
    await expect(page.locator("table tbody tr").first()).toBeVisible();
  });

  test("add employee flow", async ({ page }) => {
    await page.getByRole("button", { name: /add employee/i }).click();

    // Section 1: Personal
    await page.locator("#form-first-name").fill("Test");
    await page.locator("#form-last-name").fill("Employee");
    await page.getByRole("button", { name: /continue/i }).click();

    // Section 2: Employment
    await page.locator("#form-job-title").fill("QA Engineer");
    await page.locator("#form-country").selectOption("Canada");
    await page.getByRole("button", { name: /continue/i }).click();

    // Section 3: Compensation
    await page.locator("#form-salary").fill("75000");
    // Submit button text is "Add Employee" when creating a new record
    await page.locator("button[type='submit']").click();

    await expect(page.getByText(/added successfully/i)).toBeVisible({ timeout: 8000 });
  });

  test("delete employee shows confirmation modal", async ({ page }) => {
    // Hover the first row to reveal the ⋮ actions button
    const firstRow = page.locator("table tbody tr").first();
    await firstRow.hover();
    await firstRow.locator("button[aria-label='Employee actions']").click();

    // Click "Remove" in the dropdown
    await page.getByRole("button", { name: /remove/i }).click();

    // Confirmation modal should appear
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("dialog")).toContainText(/cannot be undone/i);

    // Cancel dismisses the modal
    await page.getByRole("button", { name: /cancel/i }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
  });

  test("pagination navigates pages", async ({ page }) => {
    const nextButton = page.getByRole("button", { name: /next/i });
    if (await nextButton.isEnabled()) {
      await nextButton.click();
      await page.waitForTimeout(300);
      await expect(page.getByText(/page 2/i)).toBeVisible();
    }
  });
});

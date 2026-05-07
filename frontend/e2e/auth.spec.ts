import { expect, test } from "@playwright/test";
import { setupAuthMock, setupEmployeesMock } from "./mocks";

const HR_EMAIL = "hr@incubyte.co";
const HR_PASSWORD = "password123";

test.describe("Authentication", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.evaluate(() => {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
    });
  });

  test("login page renders correctly", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /salary management/i })).toBeVisible();
    await expect(page.getByLabel("Email address")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("successful login redirects to employees page", async ({ page }) => {
    await setupAuthMock(page);
    await setupEmployeesMock(page);
    await page.goto("/login");
    await page.getByLabel("Email address").fill(HR_EMAIL);
    await page.getByLabel("Password").fill(HR_PASSWORD);
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL("/");
    await expect(page.getByRole("heading", { name: /employees/i })).toBeVisible();
  });

  test("wrong password shows error", async ({ page }) => {
    await setupAuthMock(page);
    await page.goto("/login");
    await page.getByLabel("Email address").fill(HR_EMAIL);
    await page.getByLabel("Password").fill("wrongpassword");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page.getByTestId("form-error")).toContainText(/invalid/i);
  });

  test("missing email shows validation error", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page.getByTestId("form-error")).toContainText(/email/i);
  });

  test("signup page renders correctly", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.getByRole("heading", { name: /create account/i })).toBeVisible();
    await expect(page.getByLabel("Email address")).toBeVisible();
    await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Confirm password")).toBeVisible();
  });

  test("signup with mismatched passwords shows error", async ({ page }) => {
    await page.goto("/signup");
    await page.getByLabel("Email address").fill("newuser@example.com");
    await page.getByLabel("Password", { exact: true }).fill("password123");
    await page.getByLabel("Confirm password").fill("different123");
    await page.getByRole("button", { name: /create account/i }).click();
    await expect(page.getByTestId("form-error")).toContainText(/match/i);
  });

  test("unauthenticated user is redirected to login", async ({ page }) => {
    await page.goto("/");
    await page.waitForURL(/login/);
    await expect(page.getByLabel("Email address")).toBeVisible();
  });

  test("logout clears session and redirects to login", async ({ page }) => {
    await setupAuthMock(page);
    await setupEmployeesMock(page);
    await page.goto("/login");
    await page.getByLabel("Email address").fill(HR_EMAIL);
    await page.getByLabel("Password").fill(HR_PASSWORD);
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL("/");

    // Open profile dropdown then sign out
    await page.getByTestId("profile-menu-btn").click();
    await page.getByRole("button", { name: /sign out/i }).click();
    await page.waitForURL(/login/);
    await expect(page.getByLabel("Email address")).toBeVisible();
  });
});

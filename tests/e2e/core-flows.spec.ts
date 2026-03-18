import { expect, test } from "@playwright/test";

test.describe("core flows", () => {
  test("redirects unauthenticated users to login", async ({ page }) => {
    await page.goto("/app/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("renders login page shell", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByText(/TaskFlow/i)).toBeVisible();
  });
});

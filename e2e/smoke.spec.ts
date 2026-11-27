import { test, expect } from "@playwright/test";

/**
 * Public-route smoke. Authenticated CRUD needs a Clerk test instance + secrets;
 * keep that as a follow-up (see TESTING_STRATEGY.md).
 */
test.describe("public smoke", () => {
  test("sign-in page renders", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page).toHaveURL(/sign-in/);
    await expect(page.locator("body")).toBeVisible();
  });

  test("sign-up page renders", async ({ page }) => {
    await page.goto("/sign-up");
    await expect(page).toHaveURL(/sign-up/);
    await expect(page.locator("body")).toBeVisible();
  });
});

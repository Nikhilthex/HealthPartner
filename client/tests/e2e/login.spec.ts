import { expect, test } from "@playwright/test";

test("logs in with the seeded local user and reaches the protected shell", async ({ page }) => {
  await page.goto("/login");

  await expect(page.getByRole("heading", { name: "Login" })).toBeVisible();

  await page.getByLabel("Username").fill("demo");
  await page.getByLabel("Password").fill("demo123");
  await page.getByRole("button", { name: "Login" }).click();

  await expect(page.getByRole("heading", { name: /welcome, demo/i })).toBeVisible();
  await expect(page.getByRole("link", { name: "Add Medicine" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Customize Alerts" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Analyze Reports" })).toBeVisible();
});

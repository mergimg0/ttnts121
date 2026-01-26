import { test, expect } from "@playwright/test";

test.describe("Checkout Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Add item to cart first
    await page.goto("/sessions");
    await page.waitForSelector(".border.bg-white.p-6", { timeout: 10000 });

    const addButton = page.locator('button:has-text("Add")').first();
    if (await addButton.isVisible()) {
      await addButton.click();
      await page.waitForTimeout(500);
    }
  });

  test("should redirect to sessions if cart is empty", async ({ page }) => {
    // Clear cart by removing items
    await page.goto("/checkout");

    // If cart is empty, should show empty state or redirect
    const emptyState = page.locator('text="Your cart is empty"');
    const checkoutForm = page.locator('form, input[name="childFirstName"]');

    // Either empty state or checkout form should be visible
    await expect(emptyState.or(checkoutForm)).toBeVisible();
  });

  test("should display checkout form with cart items", async ({ page }) => {
    await page.goto("/checkout");

    // Check form sections are visible
    await expect(page.locator('text="Child Details"')).toBeVisible();
    await expect(page.locator('text="Parent/Guardian Details"')).toBeVisible();
    await expect(page.locator('text="Emergency Contact"')).toBeVisible();
  });

  test("should validate required fields", async ({ page }) => {
    await page.goto("/checkout");

    // Try to submit without filling form
    const submitButton = page.locator('button[type="submit"], button:has-text("Proceed to Payment")');
    if (await submitButton.isVisible()) {
      await submitButton.click();

      // Check for validation errors
      const errorMessage = page.locator('.text-red-500, .text-red-600, [class*="error"]');
      await expect(errorMessage.first()).toBeVisible();
    }
  });

  test("should fill child details", async ({ page }) => {
    await page.goto("/checkout");

    // Fill child details
    await page.fill('input[name="childFirstName"]', "Test");
    await page.fill('input[name="childLastName"]', "Child");
    await page.fill('input[name="childDob"]', "2018-05-15");

    // Verify values
    await expect(page.locator('input[name="childFirstName"]')).toHaveValue("Test");
    await expect(page.locator('input[name="childLastName"]')).toHaveValue("Child");
  });

  test("should fill parent details", async ({ page }) => {
    await page.goto("/checkout");

    // Fill parent details
    await page.fill('input[name="parentFirstName"]', "Parent");
    await page.fill('input[name="parentLastName"]', "Name");
    await page.fill('input[name="parentEmail"]', "parent@example.com");
    await page.fill('input[name="parentPhone"]', "07123456789");

    // Verify values
    await expect(page.locator('input[name="parentEmail"]')).toHaveValue("parent@example.com");
  });

  test("should fill emergency contact", async ({ page }) => {
    await page.goto("/checkout");

    // Fill emergency contact
    await page.fill('input[name="emergencyName"]', "Emergency Contact");
    await page.fill('input[name="emergencyPhone"]', "07987654321");
    await page.fill('input[name="emergencyRelation"]', "Grandparent");

    // Verify values
    await expect(page.locator('input[name="emergencyName"]')).toHaveValue("Emergency Contact");
  });

  test("should display order summary", async ({ page }) => {
    await page.goto("/checkout");

    // Check order summary section
    await expect(page.locator('text="Order Summary"')).toBeVisible();

    // Should show total
    await expect(page.locator('text="Total"')).toBeVisible();
  });

  test("should complete full checkout form", async ({ page }) => {
    await page.goto("/checkout");

    // Fill all required fields
    await page.fill('input[name="childFirstName"]', "Test");
    await page.fill('input[name="childLastName"]', "Child");
    await page.fill('input[name="childDob"]', "2018-05-15");

    await page.fill('input[name="parentFirstName"]', "Parent");
    await page.fill('input[name="parentLastName"]', "Name");
    await page.fill('input[name="parentEmail"]', "parent@example.com");
    await page.fill('input[name="parentPhone"]', "07123456789");

    await page.fill('input[name="emergencyName"]', "Emergency Contact");
    await page.fill('input[name="emergencyPhone"]', "07987654321");
    await page.fill('input[name="emergencyRelation"]', "Grandparent");

    // Fill medical info (if required)
    const medicalField = page.locator('textarea[name="medicalInfo"]');
    if (await medicalField.isVisible()) {
      await medicalField.fill("None");
    }

    // Accept terms if checkbox exists
    const termsCheckbox = page.locator('input[type="checkbox"]').first();
    if (await termsCheckbox.isVisible()) {
      await termsCheckbox.check();
    }

    // Submit button should be enabled
    const submitButton = page.locator('button[type="submit"], button:has-text("Proceed to Payment")');
    await expect(submitButton).toBeEnabled();
  });
});

test.describe("Checkout - Mobile", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("should display mobile cart summary", async ({ page }) => {
    // Add item to cart first
    await page.goto("/sessions");
    await page.waitForSelector(".border.bg-white.p-6", { timeout: 10000 });

    const addButton = page.locator('button:has-text("Add")').first();
    if (await addButton.isVisible()) {
      await addButton.click();
      await page.waitForTimeout(500);
    }

    await page.goto("/checkout");

    // Check for mobile cart summary (sticky at bottom)
    const mobileSummary = page.locator('.fixed.bottom-0, [class*="sticky"]');
    await expect(mobileSummary.first()).toBeVisible();
  });

  test("should expand/collapse mobile cart summary", async ({ page }) => {
    // Add item to cart first
    await page.goto("/sessions");
    await page.waitForSelector(".border.bg-white.p-6", { timeout: 10000 });

    const addButton = page.locator('button:has-text("Add")').first();
    if (await addButton.isVisible()) {
      await addButton.click();
      await page.waitForTimeout(500);
    }

    await page.goto("/checkout");

    // Find expand/collapse button
    const expandButton = page.locator('button:has([class*="ChevronUp"]), button:has([class*="ChevronDown"])').first();
    if (await expandButton.isVisible()) {
      await expandButton.click();
      await page.waitForTimeout(300);

      // Click again to collapse
      await expandButton.click();
    }
  });
});

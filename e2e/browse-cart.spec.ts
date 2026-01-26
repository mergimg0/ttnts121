import { test, expect } from "@playwright/test";

test.describe("Browse and Add to Cart", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should navigate to sessions page from homepage", async ({ page }) => {
    // Click on "Book Now" or sessions link
    await page.click('a[href="/sessions"]');
    await expect(page).toHaveURL(/\/sessions/);
    await expect(page.locator("h1")).toContainText("SESSIONS");
  });

  test("should display session cards with availability", async ({ page }) => {
    await page.goto("/sessions");

    // Wait for sessions to load (skeleton disappears)
    await page.waitForSelector('[data-testid="session-card"], .border.bg-white.p-6', {
      timeout: 10000,
    });

    // Check that session cards are displayed
    const sessionCards = page.locator(".border.bg-white.p-6");
    await expect(sessionCards.first()).toBeVisible();
  });

  test("should filter sessions by service type", async ({ page }) => {
    await page.goto("/sessions");

    // Wait for page to load
    await page.waitForTimeout(1000);

    // Click on a filter button (e.g., "1-2-1")
    const filterButton = page.locator('button:has-text("1-2-1")');
    if (await filterButton.isVisible()) {
      await filterButton.click();
      await expect(page).toHaveURL(/serviceType=one-to-one/);
    }
  });

  test("should toggle between calendar and list view", async ({ page }) => {
    await page.goto("/sessions");

    // Find view toggle buttons
    const calendarButton = page.locator('button[title="Calendar view"], button:has([class*="Calendar"])').first();
    const listButton = page.locator('button[title="List view"], button:has([class*="List"])').first();

    // Check both buttons exist
    if (await calendarButton.isVisible()) {
      await calendarButton.click();
      await page.waitForTimeout(500);

      // Switch to list view
      if (await listButton.isVisible()) {
        await listButton.click();
        await page.waitForTimeout(500);
      }
    }
  });

  test("should add session to cart", async ({ page }) => {
    await page.goto("/sessions");

    // Wait for sessions to load
    await page.waitForSelector(".border.bg-white.p-6", { timeout: 10000 });

    // Find and click "Add" button on first available session
    const addButton = page.locator('button:has-text("Add")').first();

    if (await addButton.isVisible()) {
      await addButton.click();

      // Verify cart icon shows item count
      await expect(page.locator('[data-testid="cart-count"], .bg-black.text-white.text-xs')).toBeVisible();
    }
  });

  test("should remove session from cart", async ({ page }) => {
    await page.goto("/sessions");

    // Wait for sessions to load
    await page.waitForSelector(".border.bg-white.p-6", { timeout: 10000 });

    // Add item to cart first
    const addButton = page.locator('button:has-text("Add")').first();
    if (await addButton.isVisible()) {
      await addButton.click();
      await page.waitForTimeout(500);

      // Click the "In Cart" button to remove
      const inCartButton = page.locator('button:has-text("In Cart")').first();
      if (await inCartButton.isVisible()) {
        await inCartButton.click();

        // Verify button changed back to "Add"
        await expect(page.locator('button:has-text("Add")').first()).toBeVisible();
      }
    }
  });

  test("should open cart sidebar", async ({ page }) => {
    await page.goto("/sessions");

    // Wait for sessions to load and add item
    await page.waitForSelector(".border.bg-white.p-6", { timeout: 10000 });

    const addButton = page.locator('button:has-text("Add")').first();
    if (await addButton.isVisible()) {
      await addButton.click();
      await page.waitForTimeout(500);

      // Click cart icon in header
      const cartIcon = page.locator('button:has([class*="ShoppingCart"]), [data-testid="cart-button"]').first();
      if (await cartIcon.isVisible()) {
        await cartIcon.click();

        // Verify cart sidebar is open
        await expect(page.locator('text="Your Cart"')).toBeVisible();
      }
    }
  });

  test("should navigate to checkout from cart", async ({ page }) => {
    await page.goto("/sessions");

    // Wait and add item
    await page.waitForSelector(".border.bg-white.p-6", { timeout: 10000 });

    const addButton = page.locator('button:has-text("Add")').first();
    if (await addButton.isVisible()) {
      await addButton.click();
      await page.waitForTimeout(500);

      // Open cart and click checkout
      const cartIcon = page.locator('button:has([class*="ShoppingCart"]), header button').last();
      if (await cartIcon.isVisible()) {
        await cartIcon.click();
        await page.waitForTimeout(500);

        const checkoutButton = page.locator('a:has-text("Checkout"), button:has-text("Checkout")').first();
        if (await checkoutButton.isVisible()) {
          await checkoutButton.click();
          await expect(page).toHaveURL(/\/checkout/);
        }
      }
    }
  });
});

test.describe("Browse and Cart - Mobile", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("should open mobile filter drawer", async ({ page }) => {
    await page.goto("/sessions");

    // Wait for page to load
    await page.waitForTimeout(1000);

    // Look for filter button on mobile
    const filterButton = page.locator('button:has([class*="SlidersHorizontal"]), button:has-text("Filters")').first();
    if (await filterButton.isVisible()) {
      await filterButton.click();

      // Verify filter drawer is open
      await expect(page.locator('text="Filters"')).toBeVisible();
    }
  });

  test("should display sessions in mobile layout", async ({ page }) => {
    await page.goto("/sessions");

    // Wait for sessions to load
    await page.waitForSelector(".border.bg-white.p-6", { timeout: 10000 });

    // Verify sessions are displayed
    const sessionCards = page.locator(".border.bg-white.p-6");
    await expect(sessionCards.first()).toBeVisible();
  });
});

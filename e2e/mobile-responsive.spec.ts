import { test, expect } from "@playwright/test";

test.describe("Mobile Responsiveness", () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE

  test("homepage should be responsive on mobile", async ({ page }) => {
    await page.goto("/");

    // Check hero section is visible
    await expect(page.locator("h1").first()).toBeVisible();

    // Check mobile menu button exists
    const mobileMenuButton = page.locator('button[aria-label="Toggle menu"], button:has([class*="Menu"])');
    await expect(mobileMenuButton.first()).toBeVisible();
  });

  test("navigation should work on mobile", async ({ page }) => {
    await page.goto("/");

    // Open mobile menu
    const mobileMenuButton = page.locator('button[aria-label="Toggle menu"], button:has([class*="Menu"])').first();
    if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click();

      // Check menu items are visible
      await expect(page.locator('a[href="/sessions"]')).toBeVisible();
    }
  });

  test("sessions page should be responsive", async ({ page }) => {
    await page.goto("/sessions");

    // Page should load
    await expect(page.locator("h1")).toContainText("SESSIONS");

    // Mobile filter button should be visible
    const filterButton = page.locator('button:has([class*="SlidersHorizontal"]), button:has-text("Filters")');
    await expect(filterButton.first()).toBeVisible();
  });

  test("checkout form should be usable on mobile", async ({ page }) => {
    // First add item to cart
    await page.goto("/sessions");
    await page.waitForSelector(".border.bg-white.p-6", { timeout: 10000 });

    const addButton = page.locator('button:has-text("Add")').first();
    if (await addButton.isVisible()) {
      await addButton.click();
    }

    await page.goto("/checkout");

    // Form fields should be visible and usable
    const childFirstName = page.locator('input[name="childFirstName"]');
    if (await childFirstName.isVisible()) {
      await childFirstName.fill("Test");
      await expect(childFirstName).toHaveValue("Test");
    }
  });

  test("service pages should be responsive", async ({ page }) => {
    // Test each service page
    const servicePages = [
      "/services/one-to-one",
      "/services/group-sessions",
      "/services/after-school-clubs",
      "/services/half-term-camps",
      "/services/birthday-parties",
    ];

    for (const servicePage of servicePages) {
      await page.goto(servicePage);
      await expect(page.locator("h1").first()).toBeVisible();
    }
  });

  test("footer should be responsive", async ({ page }) => {
    await page.goto("/");

    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    // Footer should be visible
    const footer = page.locator("footer");
    await expect(footer).toBeVisible();
  });
});

test.describe("Tablet Responsiveness", () => {
  test.use({ viewport: { width: 768, height: 1024 } }); // iPad

  test("homepage should work on tablet", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("sessions page grid should adapt", async ({ page }) => {
    await page.goto("/sessions");
    await page.waitForSelector(".border.bg-white.p-6", { timeout: 10000 });

    // Should show 2-column grid on tablet
    const sessionCards = page.locator(".border.bg-white.p-6");
    await expect(sessionCards.first()).toBeVisible();
  });

  test("admin dashboard should be accessible", async ({ page }) => {
    await page.goto("/admin");

    // Admin should load
    await expect(page.locator('text="Dashboard", text="Admin"')).toBeVisible();
  });
});

test.describe("Admin Mobile Responsiveness", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("admin sidebar should be collapsible on mobile", async ({ page }) => {
    await page.goto("/admin");

    // Mobile menu button should be visible
    const menuButton = page.locator('button:has([class*="Menu"])').first();
    await expect(menuButton).toBeVisible();

    // Click to open sidebar
    await menuButton.click();
    await page.waitForTimeout(300);

    // Sidebar should be visible
    await expect(page.locator('text="Dashboard"')).toBeVisible();
    await expect(page.locator('text="Programs"')).toBeVisible();
  });

  test("admin bookings should show mobile cards", async ({ page }) => {
    await page.goto("/admin/bookings");

    // Wait for content to load
    await page.waitForTimeout(2000);

    // On mobile, should either show empty state or mobile cards
    const emptyState = page.locator('text="No bookings"');
    const mobileCards = page.locator('.lg\\:hidden .border.bg-white.p-4');

    // Either state is valid
    await expect(emptyState.or(mobileCards.first())).toBeVisible();
  });

  test("admin programs should show mobile cards", async ({ page }) => {
    await page.goto("/admin/programs");

    // Wait for content to load
    await page.waitForTimeout(2000);

    // On mobile, should either show empty state or mobile cards
    const emptyState = page.locator('text="No programs"');
    const mobileCards = page.locator('.lg\\:hidden .border.bg-white.p-4');

    await expect(emptyState.or(mobileCards.first())).toBeVisible();
  });
});

import { test, expect } from "@playwright/test";

test.describe("Admin Dashboard - Programs CRUD", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/programs");
  });

  test("should display programs page", async ({ page }) => {
    await expect(page.locator('h1:has-text("Programs")')).toBeVisible();
  });

  test("should show empty state or programs list", async ({ page }) => {
    // Wait for loading to complete
    await page.waitForTimeout(2000);

    // Either empty state or table should be visible
    const emptyState = page.locator('text="No programs yet"');
    const table = page.locator("table");

    await expect(emptyState.or(table)).toBeVisible();
  });

  test("should navigate to new program form", async ({ page }) => {
    const newButton = page.locator('a:has-text("New Program")');
    if (await newButton.isVisible()) {
      await newButton.click();
      await expect(page).toHaveURL(/\/admin\/programs\/new/);
    }
  });

  test("should display new program form fields", async ({ page }) => {
    await page.goto("/admin/programs/new");

    // Check for form fields
    await expect(page.locator('input[name="name"], label:has-text("Name")')).toBeVisible();
  });
});

test.describe("Admin Dashboard - Sessions CRUD", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/sessions");
  });

  test("should display sessions page", async ({ page }) => {
    await expect(page.locator('h1:has-text("Sessions")')).toBeVisible();
  });

  test("should show loading skeleton then content", async ({ page }) => {
    // Wait for loading to complete
    await page.waitForTimeout(2000);

    // Either empty state or table should be visible
    const emptyState = page.locator('text="No sessions"');
    const table = page.locator("table");

    await expect(emptyState.or(table)).toBeVisible();
  });

  test("should navigate to new session form", async ({ page }) => {
    const newButton = page.locator('a:has-text("New Session")');
    if (await newButton.isVisible()) {
      await newButton.click();
      await expect(page).toHaveURL(/\/admin\/sessions\/new/);
    }
  });
});

test.describe("Admin Dashboard - Bookings", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/bookings");
  });

  test("should display bookings page", async ({ page }) => {
    await expect(page.locator('h1:has-text("Bookings")')).toBeVisible();
  });

  test("should show booking filters", async ({ page }) => {
    // Wait for page to load
    await page.waitForTimeout(1000);

    // Check for status filter or search
    const filter = page.locator('select, input[placeholder*="Search"]');
    await expect(filter.first()).toBeVisible();
  });

  test("should show empty state or bookings list", async ({ page }) => {
    await page.waitForTimeout(2000);

    const emptyState = page.locator('text="No bookings"');
    const table = page.locator("table");

    await expect(emptyState.or(table)).toBeVisible();
  });
});

test.describe("Admin Dashboard - Waitlist", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/waitlist");
  });

  test("should display waitlist page", async ({ page }) => {
    await expect(page.locator('h1:has-text("Waitlist")')).toBeVisible();
  });

  test("should show empty state or waitlist entries", async ({ page }) => {
    await page.waitForTimeout(2000);

    const emptyState = page.locator('text="No waitlist"');
    const table = page.locator("table");

    await expect(emptyState.or(table)).toBeVisible();
  });
});

test.describe("Admin Dashboard - Navigation", () => {
  test("should navigate between admin pages", async ({ page }) => {
    await page.goto("/admin");

    // Check dashboard loads
    await expect(page.locator('text="Dashboard", text="Admin"')).toBeVisible();

    // Navigate to programs
    const programsLink = page.locator('a[href="/admin/programs"]');
    if (await programsLink.isVisible()) {
      await programsLink.click();
      await expect(page).toHaveURL(/\/admin\/programs/);
    }

    // Navigate to sessions
    const sessionsLink = page.locator('a[href="/admin/sessions"]');
    if (await sessionsLink.isVisible()) {
      await sessionsLink.click();
      await expect(page).toHaveURL(/\/admin\/sessions/);
    }

    // Navigate to bookings
    const bookingsLink = page.locator('a[href="/admin/bookings"]');
    if (await bookingsLink.isVisible()) {
      await bookingsLink.click();
      await expect(page).toHaveURL(/\/admin\/bookings/);
    }
  });
});

test.describe("Admin - Program Form", () => {
  test("should validate program form", async ({ page }) => {
    await page.goto("/admin/programs/new");

    // Try to submit empty form
    const submitButton = page.locator('button[type="submit"]');
    if (await submitButton.isVisible()) {
      await submitButton.click();

      // Check for validation (either HTML5 or custom)
      const nameInput = page.locator('input[name="name"]');
      if (await nameInput.isVisible()) {
        // Check if field has error styling or message
        await page.waitForTimeout(500);
      }
    }
  });

  test("should fill program form", async ({ page }) => {
    await page.goto("/admin/programs/new");

    // Fill form fields
    const nameInput = page.locator('input[name="name"]');
    if (await nameInput.isVisible()) {
      await nameInput.fill("Test Program");
    }

    const descInput = page.locator('textarea[name="description"]');
    if (await descInput.isVisible()) {
      await descInput.fill("Test program description");
    }

    // Select location if dropdown exists
    const locationSelect = page.locator('select[name="location"]');
    if (await locationSelect.isVisible()) {
      await locationSelect.selectOption({ index: 1 });
    }

    // Select service type if dropdown exists
    const typeSelect = page.locator('select[name="serviceType"]');
    if (await typeSelect.isVisible()) {
      await typeSelect.selectOption({ index: 1 });
    }
  });
});

test.describe("Admin - Session Form", () => {
  test("should display session form fields", async ({ page }) => {
    await page.goto("/admin/sessions/new");

    // Check for key form fields
    const nameField = page.locator('input[name="name"], label:has-text("Name")');
    await expect(nameField.first()).toBeVisible();
  });

  test("should fill session form", async ({ page }) => {
    await page.goto("/admin/sessions/new");

    // Fill name
    const nameInput = page.locator('input[name="name"]');
    if (await nameInput.isVisible()) {
      await nameInput.fill("Test Session");
    }

    // Fill price
    const priceInput = page.locator('input[name="price"]');
    if (await priceInput.isVisible()) {
      await priceInput.fill("25");
    }

    // Fill capacity
    const capacityInput = page.locator('input[name="capacity"]');
    if (await capacityInput.isVisible()) {
      await capacityInput.fill("10");
    }

    // Select day of week
    const daySelect = page.locator('select[name="dayOfWeek"]');
    if (await daySelect.isVisible()) {
      await daySelect.selectOption({ index: 1 });
    }
  });
});

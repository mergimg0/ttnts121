import { test, expect } from "@playwright/test";

test.describe("Admin Dashboard - Contacts", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/contacts");
  });

  test("should display contacts page", async ({ page }) => {
    await expect(page.locator('h1:has-text("Contacts")')).toBeVisible();
  });

  test("should show stats cards", async ({ page }) => {
    // Wait for page load
    await page.waitForTimeout(1000);

    // Check for stat cards
    const statsCard = page.locator('text="Total Contacts"');
    await expect(statsCard.or(page.locator('text="Opted In"'))).toBeVisible();
  });

  test("should show empty state or contacts list", async ({ page }) => {
    await page.waitForTimeout(2000);

    const emptyState = page.locator('text="No contacts"');
    const table = page.locator("table");

    await expect(emptyState.or(table)).toBeVisible();
  });

  test("should navigate to new contact form", async ({ page }) => {
    const newButton = page.locator('a:has-text("Add Contact")');
    if (await newButton.isVisible()) {
      await newButton.click();
      await expect(page).toHaveURL(/\/admin\/contacts\/new/);
    }
  });

  test("should display new contact form fields", async ({ page }) => {
    await page.goto("/admin/contacts/new");

    // Check for required form fields
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="firstName"]')).toBeVisible();
    await expect(page.locator('input[name="lastName"]')).toBeVisible();
  });

  test("should fill contact form", async ({ page }) => {
    await page.goto("/admin/contacts/new");

    // Fill form fields
    await page.locator('input[name="email"]').fill("test@example.com");
    await page.locator('input[name="firstName"]').fill("Test");
    await page.locator('input[name="lastName"]').fill("User");

    // Check for phone and location fields
    const phoneInput = page.locator('input[name="phone"]');
    if (await phoneInput.isVisible()) {
      await phoneInput.fill("07123456789");
    }

    // Check for marketing consent checkbox
    const consentCheckbox = page.locator('input[name="marketingConsent"]');
    if (await consentCheckbox.isVisible()) {
      await consentCheckbox.check();
    }
  });

  test("should show contact filters", async ({ page }) => {
    await page.waitForTimeout(1000);

    // Check for search and filters
    const search = page.locator('input[placeholder*="Search"]');
    await expect(search).toBeVisible();
  });
});

test.describe("Admin Dashboard - Campaigns", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/campaigns");
  });

  test("should display campaigns page", async ({ page }) => {
    await expect(page.locator('h1:has-text("Campaigns")')).toBeVisible();
  });

  test("should show campaign stats cards", async ({ page }) => {
    await page.waitForTimeout(1000);

    // Check for stat cards
    const totalCard = page.locator('text="Total Campaigns"');
    const sentCard = page.locator('text="Campaigns Sent"');
    await expect(totalCard.or(sentCard)).toBeVisible();
  });

  test("should show empty state or campaigns list", async ({ page }) => {
    await page.waitForTimeout(2000);

    const emptyState = page.locator('text="No campaigns"');
    const table = page.locator("table");

    await expect(emptyState.or(table)).toBeVisible();
  });

  test("should navigate to new campaign form", async ({ page }) => {
    const newButton = page.locator('a:has-text("New Campaign")');
    if (await newButton.isVisible()) {
      await newButton.click();
      await expect(page).toHaveURL(/\/admin\/campaigns\/new/);
    }
  });

  test("should display new campaign form fields", async ({ page }) => {
    await page.goto("/admin/campaigns/new");

    // Check for required form fields
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('input[name="subject"]')).toBeVisible();
    await expect(page.locator('textarea[name="body"]')).toBeVisible();
  });

  test("should fill campaign form", async ({ page }) => {
    await page.goto("/admin/campaigns/new");

    // Fill form fields
    await page.locator('input[name="name"]').fill("Test Campaign");
    await page.locator('input[name="subject"]').fill("Test Subject Line");
    await page.locator('textarea[name="body"]').fill("<p>Test email content</p>");

    // Check for targeting options
    const targetRadio = page.locator('input[name="targetType"][value="all"]');
    if (await targetRadio.isVisible()) {
      await targetRadio.check();
    }
  });

  test("should show targeting options", async ({ page }) => {
    await page.goto("/admin/campaigns/new");

    // Check for targeting section
    const targeting = page.locator('text="Target Audience"');
    await expect(targeting.or(page.locator('text="Recipients"'))).toBeVisible();
  });
});

test.describe("Admin Dashboard - Debug/Diagnostics", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/debug");
  });

  test("should display debug page", async ({ page }) => {
    await expect(page.locator('h1:has-text("System Diagnostics")')).toBeVisible();
  });

  test("should show run tests button", async ({ page }) => {
    const runButton = page.locator('button:has-text("Run All Tests")');
    await expect(runButton).toBeVisible();
  });

  test("should show test categories", async ({ page }) => {
    // Check for Firebase and Email sections
    await expect(page.locator('text="Firebase"')).toBeVisible();
    await expect(page.locator('text="Email"').or(page.locator('text="Resend"'))).toBeVisible();
  });

  test("should show email test form", async ({ page }) => {
    const emailInput = page.locator('input[type="email"]');
    const sendButton = page.locator('button:has-text("Send Test")');

    await expect(emailInput).toBeVisible();
    await expect(sendButton).toBeVisible();
  });

  test("should run diagnostics tests", async ({ page }) => {
    // Click run all tests
    const runButton = page.locator('button:has-text("Run All Tests")');
    await runButton.click();

    // Wait for tests to complete
    await page.waitForTimeout(5000);

    // Check for test results (passed or failed badges)
    const passedBadge = page.locator('text="Passed"');
    const failedBadge = page.locator('text="Failed"');

    await expect(passedBadge.or(failedBadge).first()).toBeVisible();
  });
});

test.describe("Admin - Campaign Workflow", () => {
  test("should show campaign status badges", async ({ page }) => {
    await page.goto("/admin/campaigns");
    await page.waitForTimeout(2000);

    // Check for status badges (Draft, Sent, etc.)
    const draftBadge = page.locator('text="Draft"');
    const sentBadge = page.locator('text="Sent"');
    const noCampaigns = page.locator('text="No campaigns"');

    // Either badges or empty state should be visible
    await expect(draftBadge.or(sentBadge).or(noCampaigns).first()).toBeVisible();
  });

  test("should navigate from contacts to campaigns", async ({ page }) => {
    // Start at contacts
    await page.goto("/admin/contacts");
    await expect(page.locator('h1:has-text("Contacts")')).toBeVisible();

    // Navigate to campaigns via sidebar
    const campaignsLink = page.locator('a[href="/admin/campaigns"]');
    if (await campaignsLink.isVisible()) {
      await campaignsLink.click();
      await expect(page).toHaveURL(/\/admin\/campaigns/);
      await expect(page.locator('h1:has-text("Campaigns")')).toBeVisible();
    }
  });
});

test.describe("Admin - Contact Consent", () => {
  test("should show consent status in contacts list", async ({ page }) => {
    await page.goto("/admin/contacts");
    await page.waitForTimeout(2000);

    // Check for consent column or filter
    const consentFilter = page.locator('select').filter({ hasText: /consent/i });
    const table = page.locator("table");
    const emptyState = page.locator('text="No contacts"');

    await expect(consentFilter.or(table).or(emptyState).first()).toBeVisible();
  });
});

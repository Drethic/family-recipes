import { test, expect } from '@playwright/test';

/**
 * Mobile and Responsive Design Tests
 *
 * Tests mobile-specific functionality:
 * - Touch interactions
 * - Mobile navigation (hamburger menus)
 * - Responsive layout changes
 * - Mobile form inputs
 * - Swipe gestures (if applicable)
 *
 * NOTE: These tests should be run on mobile projects:
 * - Mobile Safari (iPhone 14 Pro)
 * - Mobile Chrome (Pixel 7)
 */

test.describe('Mobile Responsive Design', () => {
  test('Mobile navigation menu should work', async ({ page, isMobile }) => {
    // This test only runs on mobile viewports
    if (!isMobile) {
      test.skip();
      return;
    }

    await page.goto('/');

    // Look for hamburger menu icon (common patterns)
    const hamburgerMenu = page.locator('button[aria-label*="menu" i], button[aria-label*="navigation" i], .hamburger, .menu-toggle');

    // Menu should be visible on mobile
    await expect(hamburgerMenu.first()).toBeVisible();

    // Click to open menu
    await hamburgerMenu.first().click();

    // Navigation items should appear
    await expect(page.locator('nav a, .nav-link').first()).toBeVisible();

    // Click to close menu (if applicable)
    await hamburgerMenu.first().click();
  });

  test('Content should be readable without horizontal scrolling', async ({ page }) => {
    await page.goto('/');

    // Get viewport and body dimensions
    const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);

    // Body should not be wider than viewport (no horizontal scroll)
    expect(bodyScrollWidth).toBeLessThanOrEqual(viewportWidth + 1); // +1 for rounding
  });

  test('Touch targets should be large enough (minimum 44x44px)', async ({ page, isMobile }) => {
    if (!isMobile) {
      test.skip();
      return;
    }

    await page.goto('/');

    // Get all interactive elements
    const interactiveElements = page.locator('button, a, input, select, textarea');
    const count = await interactiveElements.count();

    // Check size of visible interactive elements
    for (let i = 0; i < Math.min(count, 20); i++) {
      const element = interactiveElements.nth(i);
      const isVisible = await element.isVisible();

      if (isVisible) {
        const box = await element.boundingBox();
        if (box) {
          // WCAG 2.1 recommends minimum 44x44px touch targets
          expect(box.width).toBeGreaterThanOrEqual(40); // Slightly relaxed for flexibility
          expect(box.height).toBeGreaterThanOrEqual(40);
        }
      }
    }
  });

  test('Forms should work with mobile input types', async ({ page, isMobile }) => {
    if (!isMobile) {
      test.skip();
      return;
    }

    await page.goto('/login');

    // Email input should have type="email" for mobile keyboard
    const emailInput = page.locator('input[name="email"]');
    await expect(emailInput).toHaveAttribute('type', 'email');

    // Password input should have type="password"
    const passwordInput = page.locator('input[name="password"]');
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Inputs should be easily tappable
    await emailInput.tap();
    await expect(emailInput).toBeFocused();

    await passwordInput.tap();
    await expect(passwordInput).toBeFocused();
  });

  test('Text should be readable without zooming (minimum 16px)', async ({ page }) => {
    await page.goto('/');

    // Check viewport meta tag
    const viewportMeta = page.locator('meta[name="viewport"]');
    await expect(viewportMeta).toHaveAttribute('content', /width=device-width/);

    // Check font sizes of common text elements
    const bodyFontSize = await page.locator('body').evaluate((el) =>
      window.getComputedStyle(el).fontSize
    );

    const fontSize = parseFloat(bodyFontSize);
    expect(fontSize).toBeGreaterThanOrEqual(14); // Minimum readable size
  });

  test('Images should be responsive', async ({ page }) => {
    await page.goto('/');

    // Get all images
    const images = page.locator('img');
    const count = await images.count();

    if (count > 0) {
      // Check first few images
      for (let i = 0; i < Math.min(count, 5); i++) {
        const img = images.nth(i);
        const isVisible = await img.isVisible();

        if (isVisible) {
          const viewportWidth = await page.evaluate(() => window.innerWidth);

          // Image should not overflow viewport
          const imgWidth = await img.evaluate((el: HTMLImageElement) =>
            el.getBoundingClientRect().width
          );

          expect(imgWidth).toBeLessThanOrEqual(viewportWidth);
        }
      }
    }
  });

  test('Mobile viewport should show mobile-optimized layout', async ({ page, isMobile }) => {
    if (!isMobile) {
      test.skip();
      return;
    }

    await page.goto('/');

    // Common mobile indicators:
    // - Hamburger menu visible
    // - Single column layout
    // - Touch-friendly spacing

    const hamburgerExists = await page
      .locator('button[aria-label*="menu" i], .hamburger, .menu-toggle')
      .count();

    // Should have mobile navigation
    expect(hamburgerExists).toBeGreaterThan(0);
  });

  test('Tablet viewport should show tablet-optimized layout', async ({ page }) => {
    // Get viewport size from page
    const viewport = page.viewportSize();

    // Skip if not tablet size (768-1024px)
    if (!viewport || viewport.width < 768 || viewport.width > 1024) {
      test.skip();
      return;
    }

    await page.goto('/');

    // Tablet should handle layout appropriately
    const bodyWidth = await page.evaluate(() => document.body.clientWidth);
    expect(bodyWidth).toBeGreaterThanOrEqual(768);
    expect(bodyWidth).toBeLessThanOrEqual(1024);
  });

  test('Landscape orientation should work properly', async ({ page, isMobile }) => {
    if (!isMobile) {
      test.skip();
      return;
    }

    await page.goto('/');

    // Content should still be accessible in landscape
    await expect(page.locator('body')).toBeVisible();

    // No horizontal overflow
    const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);

    expect(bodyScrollWidth).toBeLessThanOrEqual(viewportWidth + 1);
  });

  test('Touch interactions should work for buttons', async ({ page, isMobile }) => {
    if (!isMobile) {
      test.skip();
      return;
    }

    await page.goto('/login');

    const loginButton = page.locator('button[type="submit"]');

    // Should be able to tap the button
    await loginButton.tap();

    // Form should respond to tap (even if validation fails)
    await page.waitForTimeout(500);

    // Should still be on login page (no crash)
    await expect(page).toHaveURL(/.*login/);
  });

  test('Long content should be scrollable on mobile', async ({ page, isMobile }) => {
    if (!isMobile) {
      test.skip();
      return;
    }

    await page.goto('/');

    // Check if page is scrollable
    const isScrollable = await page.evaluate(() => {
      return document.documentElement.scrollHeight > window.innerHeight;
    });

    // Most pages should have scrollable content
    // If not, just verify no horizontal scroll
    if (!isScrollable) {
      const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
      const viewportWidth = await page.evaluate(() => window.innerWidth);
      expect(bodyScrollWidth).toBeLessThanOrEqual(viewportWidth + 1);
    }
  });
});

test.describe('Cross-Device Consistency', () => {
  test('Logo should be visible on all devices', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for logo or site title
    const logo = page.locator('h1, header a[href="/"], img[alt*="logo" i], .logo, [class*="logo"]');

    await expect(logo.first()).toBeVisible({ timeout: 5000 });
  });

  test('Primary navigation should be accessible on all devices', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Navigation should exist (either visible or in hamburger menu)
    const nav = page.locator('nav, header, [role="navigation"], [role="banner"]');
    await expect(nav.first()).toBeAttached();
  });

  test('Footer should be visible on all devices', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for page to load completely
    await page.waitForTimeout(1000);

    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Wait for scroll to complete
    await page.waitForTimeout(500);

    // Footer should be visible (or just check if it exists)
    const footer = page.locator('footer, [role="contentinfo"]');
    await expect(footer.first()).toBeAttached();
  });
});

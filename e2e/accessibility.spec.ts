import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Accessibility Testing with axe-core
 *
 * These tests check for WCAG 2.1 Level A and AA compliance
 * across different pages and user flows.
 *
 * IMPORTANT: Run these tests on all projects (desktop, mobile, tablet)
 * to ensure accessibility across all devices.
 */

test.describe('Accessibility Tests', () => {
  // Clear cookies before each test to ensure clean authentication state
  test.beforeEach(async ({ context, page }) => {
    await context.clearCookies();

    // Capture console logs for debugging
    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('[AuthRestoration]') || text.includes('[Header]')) {
        console.log(`[Browser Console] ${text}`);
      }
    });
  });

  test('Home page should not have accessibility violations', async ({ page }) => {
    await page.goto('/');

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');

    // Run axe accessibility scan
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    // Assert no violations found
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Login page should not have accessibility violations', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Register page should not have accessibility violations', async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Should pass accessibility after form interaction', async ({ page }) => {
    await page.goto('/login');

    // Interact with the form
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');

    // Check accessibility after interaction
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Should have proper keyboard navigation', async ({ page }) => {
    await page.goto('/login');

    // Test keyboard navigation with Tab
    await page.keyboard.press('Tab');
    const emailInput = page.locator('input[name="email"]');
    await expect(emailInput).toBeFocused();

    await page.keyboard.press('Tab');
    const passwordInput = page.locator('input[name="password"]');
    await expect(passwordInput).toBeFocused();

    await page.keyboard.press('Tab');
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeFocused();

    // Verify form can be submitted with Enter key
    await emailInput.fill('test@example.com');
    await passwordInput.fill('password123');
    await page.keyboard.press('Enter');

    // Form should attempt to submit (will fail with test credentials)
    await expect(page).toHaveURL(/.*login.*/);
  });

  test('Should pass color contrast checks', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Specifically check for color contrast issues
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .include(['body'])
      .analyze();

    // Filter for color-contrast specific violations
    const colorContrastViolations = accessibilityScanResults.violations.filter(
      (violation) => violation.id === 'color-contrast'
    );

    expect(colorContrastViolations).toEqual([]);
  });

  test('Should have proper ARIA labels and roles', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check for ARIA-related issues
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'best-practice'])
      .analyze();

    // Filter for ARIA violations
    const ariaViolations = accessibilityScanResults.violations.filter(
      (violation) => violation.id.startsWith('aria-')
    );

    expect(ariaViolations).toEqual([]);
  });

  test('Images should have alt text', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check specifically for image alt text
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a'])
      .analyze();

    // Filter for image alt text violations
    const imageAltViolations = accessibilityScanResults.violations.filter(
      (violation) => violation.id === 'image-alt'
    );

    expect(imageAltViolations).toEqual([]);
  });

  test('Should exclude known third-party violations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Example: Exclude third-party elements with known issues
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .exclude('#third-party-widget') // Replace with actual selector if needed
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});

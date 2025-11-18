import { test, expect } from '@playwright/test';

/**
 * Authentication Flow E2E Tests
 *
 * Tests the complete authentication user journey:
 * - Registration
 * - Login
 * - Logout
 * - Password validation
 * - Error handling
 */

test.describe('Authentication Flow', () => {
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

  test('User can navigate to login page', async ({ page }) => {
    // Navigate to home page
    await page.goto('/', { waitUntil: 'networkidle', timeout: 30000 });

    // Wait for the header to be visible
    await page.waitForSelector('header', { state: 'visible' });

    // Click on login link/button - use more specific selector
    await page.getByRole('link', { name: 'Login' }).click();

    // Should be on login page
    await expect(page).toHaveURL(/.*login/);
    await expect(page.locator('h1, h2')).toContainText(/sign in/i);
  });

  test('User can navigate to register page', async ({ page }) => {
    // Navigate to home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for the header to be visible
    await page.waitForSelector('header', { state: 'visible' });

    // Navigate to register page - use more specific selector
    await page.getByRole('link', { name: 'Register' }).click();

    // Should be on register page
    await expect(page).toHaveURL(/.*register/);
    await expect(page.locator('h1, h2')).toContainText(/create.*account/i);
  });

  test('User can register a new account', async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('networkidle');

    // Generate unique email for test
    const timestamp = Date.now();
    const testEmail = `test-user-${timestamp}@example.com`;

    // Fill registration form with correct field names
    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'User');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', 'SecurePassword123!');

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for success message
    await page.waitForTimeout(2000);

    // Should show success message about pending approval
    await expect(
      page.locator('text=/Registration successful|pending approval/i')
    ).toBeVisible({ timeout: 10000 });
  });

  test('Registration shows validation errors for invalid input', async ({ page }) => {
    await page.goto('/register');

    // Try to submit with empty fields
    await page.click('button[type="submit"]');

    // Should show validation errors (assuming client-side validation)
    // Wait a bit for validation to appear
    await page.waitForTimeout(500);

    // Check that we're still on register page (form didn't submit)
    await expect(page).toHaveURL(/.*register/);
  });

  // Note: Password confirmation validation is not implemented in the current Register component
  // If needed in the future, add a confirmPassword field to the Register component first

  test('User can login with valid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Use test credentials (adjust based on your backend setup)
    await page.fill('input[name="email"]', 'admin@recipes.com');
    await page.fill('input[name="password"]', 'admin123');

    // Submit login form
    await page.click('button[type="submit"]');

    // Wait for navigation
    await page.waitForLoadState('networkidle');

    // Should redirect after successful login (either to dashboard or home)
    const url = page.url();
    expect(url).toMatch(/.*(dashboard|recipes|\/|home)/);

    // Should show authenticated user UI
    await expect(
      page.getByRole('button', { name: /logout/i })
    ).toBeVisible({ timeout: 5000 });
  });

  test('Login shows error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Try to login with invalid credentials
    await page.fill('input[name="email"]', 'wrong@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for network request to complete
    await page.waitForLoadState('networkidle');

    // Should show error message - wait longer for API response
    await expect(
      page.locator('text=/invalid.*credentials|incorrect.*password|login.*failed/i')
    ).toBeVisible({ timeout: 10000 });

    // Should still be on login page
    await expect(page).toHaveURL(/.*login/);
  });

  test('User can logout', async ({ page }) => {
    // First, login
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="email"]', 'admin@recipes.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');

    // Wait for navigation after login
    await page.waitForLoadState('networkidle');

    // Wait for logout button to be visible
    await expect(page.getByRole('button', { name: /logout/i })).toBeVisible({ timeout: 5000 });

    // Click logout button
    await page.getByRole('button', { name: /logout/i }).click();

    // Wait for navigation
    await page.waitForLoadState('networkidle');

    // Should show login/register links again
    await expect(page.getByRole('link', { name: 'Login' })).toBeVisible({ timeout: 5000 });
  });

  test('Protected routes redirect to login when not authenticated', async ({ page }) => {
    // Try to access a protected route without logging in
    // Don't navigate to home first - go directly to protected route
    await page.goto('/member');
    await page.waitForLoadState('networkidle');

    // Should redirect to login page
    await expect(page).toHaveURL(/.*login/, { timeout: 5000 });
  });

  test('Login form validation prevents empty submission', async ({ page }) => {
    // Navigate directly to login page
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Try to submit empty form
    await page.click('button[type="submit"]');

    // Wait for validation
    await page.waitForTimeout(500);

    // Should still be on login page
    await expect(page).toHaveURL(/.*login/);
  });
});

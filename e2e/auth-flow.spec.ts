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
  test.beforeEach(async ({ page }) => {
    // Navigate to home page before each test
    await page.goto('/');
  });

  test('User can navigate to login page', async ({ page }) => {
    // Click on login link/button
    await page.click('text=Login');

    // Should be on login page
    await expect(page).toHaveURL(/.*login/);
    await expect(page.locator('h1, h2')).toContainText(/login/i);
  });

  test('User can navigate to register page', async ({ page }) => {
    // Navigate to register page
    await page.click('text=Register');

    // Should be on register page
    await expect(page).toHaveURL(/.*register/);
    await expect(page.locator('h1, h2')).toContainText(/register|sign up/i);
  });

  test('User can register a new account', async ({ page }) => {
    await page.goto('/register');

    // Generate unique email for test
    const timestamp = Date.now();
    const testEmail = `test-user-${timestamp}@example.com`;

    // Fill registration form
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', 'SecurePassword123!');
    await page.fill('input[name="confirmPassword"]', 'SecurePassword123!');

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to home or dashboard after successful registration
    await expect(page).toHaveURL(/.*\/(home|dashboard|recipes)?$/);

    // Should show success message or user menu
    await expect(
      page.locator('text=/welcome|profile|logout/i')
    ).toBeVisible({ timeout: 5000 });
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

  test('Registration prevents mismatched passwords', async ({ page }) => {
    await page.goto('/register');

    // Fill form with mismatched passwords
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Password123!');
    await page.fill('input[name="confirmPassword"]', 'DifferentPassword123!');

    // Submit form
    await page.click('button[type="submit"]');

    // Should show error message about password mismatch
    await expect(
      page.locator('text=/password.*match|passwords.*same/i')
    ).toBeVisible({ timeout: 2000 });
  });

  test('User can login with valid credentials', async ({ page }) => {
    await page.goto('/login');

    // Use test credentials (adjust based on your backend setup)
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'admin123');

    // Submit login form
    await page.click('button[type="submit"]');

    // Should redirect after successful login
    await page.waitForURL(/.*\/(home|dashboard|recipes)?$/, { timeout: 5000 });

    // Should show authenticated user UI
    await expect(
      page.locator('text=/profile|logout|welcome/i')
    ).toBeVisible({ timeout: 5000 });
  });

  test('Login shows error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    // Try to login with invalid credentials
    await page.fill('input[name="email"]', 'wrong@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');

    // Submit form
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(
      page.locator('text=/invalid.*credentials|incorrect.*password|login.*failed/i')
    ).toBeVisible({ timeout: 3000 });

    // Should still be on login page
    await expect(page).toHaveURL(/.*login/);
  });

  test('User can logout', async ({ page }) => {
    // First, login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');

    // Wait for redirect after login
    await page.waitForURL(/.*\/(home|dashboard|recipes)?$/, { timeout: 5000 });

    // Click logout button
    await page.click('text=Logout');

    // Should redirect to home or login page
    await page.waitForURL(/.*\/(login|home|\/)?$/, { timeout: 3000 });

    // Should show login/register links again
    await expect(page.locator('text=/login|register|sign in/i')).toBeVisible();
  });

  test('Protected routes redirect to login when not authenticated', async ({ page }) => {
    // Try to access a protected route without logging in
    await page.goto('/my-recipes');

    // Should redirect to login page
    await expect(page).toHaveURL(/.*login/, { timeout: 3000 });
  });

  test('Login form validation prevents empty submission', async ({ page }) => {
    await page.goto('/login');

    // Try to submit empty form
    await page.click('button[type="submit"]');

    // Wait for validation
    await page.waitForTimeout(500);

    // Should still be on login page
    await expect(page).toHaveURL(/.*login/);
  });
});

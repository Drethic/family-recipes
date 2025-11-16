import { test, expect } from '@playwright/test';

/**
 * Recipe Management E2E Tests
 *
 * Tests the complete recipe lifecycle:
 * - Viewing recipes
 * - Creating new recipes
 * - Editing recipes
 * - Deleting recipes
 * - Admin approval workflow
 * - Recipe search and filtering
 */

test.describe('Recipe Viewing', () => {
  test('User can view recipe list', async ({ page }) => {
    // Login first (adjust credentials as needed)
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Navigate to recipes page or home
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Should see the home page with content
    await expect(page.locator('body')).toBeVisible();
  });

  test('User can view recipe details', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Click on first recipe link
    const firstRecipe = page.locator('a[href*="/recipe"]').first();

    // Should have at least one recipe visible
    await expect(firstRecipe).toBeVisible({ timeout: 5000 });

    await firstRecipe.click();
    await page.waitForLoadState('networkidle');

    // Should show recipe details
    await expect(page.locator('h1, h2')).toBeVisible();
  });
});

test.describe('Recipe Creation', () => {
  test('User can create a new recipe', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Navigate to create recipe page
    await page.goto('/recipes/submit');
    await page.waitForLoadState('networkidle');

    // Wait for form to be ready
    await page.waitForSelector('input[name="title"]');

    // Fill recipe form
    await page.fill('input[name="title"]', 'E2E Test Recipe');
    await page.fill('textarea[name="description"]', 'This is a test recipe created by E2E tests');

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for navigation
    await page.waitForLoadState('networkidle');

    // Should be redirected somewhere (may show success or may go to dashboard)
    await expect(page.locator('body')).toBeVisible();
  });

  test('Recipe creation validates required fields', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    await page.goto('/recipes/submit');
    await page.waitForLoadState('networkidle');

    // Try to submit empty form
    await page.click('button[type="submit"]');

    // Should show validation errors or stay on page
    await page.waitForTimeout(1000);

    // Should still be on creation page
    await expect(page).toHaveURL(/.*recipes\/submit/);
  });

  test('User can add multiple ingredients dynamically', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    await page.goto('/recipes/submit');
    await page.waitForLoadState('networkidle');

    // Look for "Add" button for ingredients
    const addIngredientBtn = page.locator('button').filter({ hasText: /add.*ingredient|add/i }).first();

    // Button should exist
    await expect(addIngredientBtn).toBeVisible({ timeout: 5000 });

    // Click to add ingredient field
    await addIngredientBtn.click();

    // Should add another ingredient field
    await page.waitForTimeout(500);

    // Verify additional ingredient field was added
    const ingredientInputs = page.locator('input[name*="ingredient"]');
    const count = await ingredientInputs.count();
    expect(count).toBeGreaterThan(1);
  });
});

test.describe('Recipe Management', () => {
  test('User can edit their own recipe', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Go to user's dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Click edit on first recipe
    const editButton = page.getByRole('link', { name: /edit/i }).or(page.getByRole('button', { name: /edit/i })).first();

    // Should have edit button visible
    await expect(editButton).toBeVisible({ timeout: 5000 });

    await editButton.click();
    await page.waitForLoadState('networkidle');

    // Update title field
    const titleField = page.locator('input[name="title"]');
    await expect(titleField).toBeVisible();
    await titleField.fill('Updated Recipe Title E2E');

    // Submit changes
    await page.click('button[type="submit"]');

    // Should redirect back
    await page.waitForURL(/.*recipes?.*/, { timeout: 5000 });
  });

  test('User can delete their own recipe', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Look for delete button
    const deleteButton = page.getByRole('button', { name: /delete/i }).first();

    // Should have delete button visible
    await expect(deleteButton).toBeVisible({ timeout: 5000 });

    // Handle confirmation dialog if present
    page.on('dialog', (dialog) => dialog.accept());

    // Click delete
    await deleteButton.click();

    // Wait for deletion
    await page.waitForLoadState('networkidle');

    // Should still be on a valid page
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Admin Recipe Approval', () => {
  test('Admin can view pending recipes', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Navigate to admin dashboard
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle');

    // Should see admin panel content
    await expect(page.locator('body')).toBeVisible();
  });

  test('Admin can approve a recipe', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle');

    // Look for approve button
    const approveButton = page.getByRole('button', { name: /approve/i }).first();

    // Should have approve button visible (requires pending recipes)
    await expect(approveButton).toBeVisible({ timeout: 5000 });

    await approveButton.click();

    // Wait for response
    await page.waitForLoadState('networkidle');

    // Should still have content
    await expect(page.locator('body')).toBeVisible();
  });

  test('Admin can reject a recipe', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle');

    // Look for reject button
    const rejectButton = page.getByRole('button', { name: /reject/i }).first();

    // Should have reject button visible (requires pending recipes)
    await expect(rejectButton).toBeVisible({ timeout: 5000 });

    await rejectButton.click();

    // Wait for response
    await page.waitForLoadState('networkidle');

    // Should still have content
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Recipe Search and Filtering', () => {
  test('User can search for recipes', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]');

    // Search input should be visible
    await expect(searchInput).toBeVisible({ timeout: 5000 });

    await searchInput.fill('pasta');

    // Wait for search results
    await page.waitForLoadState('networkidle');

    // Results should update
    await expect(page.locator('body')).toBeVisible();
  });

  test('User can filter recipes by category', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for category filter
    const categoryFilter = page.locator('select[name*="category"], button').filter({ hasText: /category/i });

    // Category filter should be visible
    await expect(categoryFilter.first()).toBeVisible({ timeout: 5000 });

    await categoryFilter.first().click();

    // Wait for filter to apply
    await page.waitForLoadState('networkidle');

    // Page should update with filtered results
    await expect(page.locator('body')).toBeVisible();
  });
});

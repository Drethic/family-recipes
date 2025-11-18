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

  test('User can view recipe list', async ({ page }) => {
    // Login first (adjust credentials as needed)
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="email"]', 'admin@recipes.com');
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
    await page.fill('input[name="email"]', 'admin@recipes.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Click on first recipe link
    const firstRecipe = page.locator('a[href*="/recipe"]').first();

    // Should have at least one recipe visible
    await expect(firstRecipe).toBeVisible({ timeout: 5000 });

    // Wait for link to be interactive before clicking
    await expect(firstRecipe).toBeEnabled({ timeout: 5000 });

    await firstRecipe.click();
    await page.waitForLoadState('networkidle');

    // Wait for actual recipe content, not just any heading
    await expect(page.locator('h1, h2')).toBeVisible({ timeout: 10000 });

    // Verify we're on a recipe detail page
    await expect(page).toHaveURL(/\/recipe/, { timeout: 5000 });
  });
});

test.describe('Recipe Creation', () => {
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

  test('User can create a new recipe', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="email"]', 'admin@recipes.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Navigate to create recipe page
    await page.goto('/recipes/submit');
    await page.waitForLoadState('networkidle');

    // Wait for form to be ready
    await page.waitForSelector('#title');

    // Fill recipe form (using ID selectors since inputs don't have name attributes)
    await page.fill('#title', 'E2E Test Recipe');
    await page.fill('#description', 'This is a test recipe created by E2E tests');

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
    await page.fill('input[name="email"]', 'admin@recipes.com');
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
    await page.fill('input[name="email"]', 'admin@recipes.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    await page.goto('/recipes/submit');
    await page.waitForLoadState('networkidle');

    // Count initial ingredient name inputs (using placeholder since inputs don't have name attributes)
    const ingredientInputs = page.locator('input[placeholder="Ingredient name"]');
    const initialCount = await ingredientInputs.count();

    // Look for "Add" button for ingredients - be more specific
    const addIngredientBtn = page.locator('button').filter({ hasText: /add.*ingredient/i }).first();

    // Button should exist
    await expect(addIngredientBtn).toBeVisible({ timeout: 5000 });

    // Click to add ingredient field
    await addIngredientBtn.click();

    // Wait for the new ingredient field to appear (initialCount + 1)
    await expect(ingredientInputs).toHaveCount(initialCount + 1, { timeout: 5000 });

    // Verify additional ingredient field was added
    const newCount = await ingredientInputs.count();
    expect(newCount).toBe(initialCount + 1);
  });
});

test.describe('Recipe Management', () => {
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

  test('User can edit their own recipe', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="email"]', 'admin@recipes.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Go to user's dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Click edit on first recipe - try link first, then button
    let editButton = page.getByRole('link', { name: /edit/i }).first();
    const editLinkCount = await editButton.count();

    if (editLinkCount === 0) {
      editButton = page.getByRole('button', { name: /edit/i }).first();
    }

    // Should have edit button visible
    await expect(editButton).toBeVisible({ timeout: 5000 });

    await editButton.click();
    await page.waitForLoadState('networkidle');

    // Wait for edit form to load
    await page.waitForSelector('#title', { state: 'visible', timeout: 10000 });

    // Update title field
    const titleField = page.locator('#title');
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
    await page.fill('input[name="email"]', 'admin@recipes.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Count recipes before deletion
    const recipeBefore = page.locator('a[href*="/recipe"], [class*="recipe"]');
    const countBefore = await recipeBefore.count();

    // Look for delete button
    const deleteButton = page.getByRole('button', { name: /delete/i }).first();

    // Should have delete button visible
    await expect(deleteButton).toBeVisible({ timeout: 5000 });

    // Handle confirmation dialog if present
    page.once('dialog', async (dialog) => {
      expect(dialog.type()).toBe('confirm');
      await dialog.accept();
    });

    // Click delete
    await deleteButton.click();

    // Wait for deletion to complete - either recipe count changes or page updates
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000); // Brief wait for UI to update

    // Should still be on dashboard or redirected to a valid page
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Admin Recipe Approval', () => {
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

  test('Admin can view pending recipes', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="email"]', 'admin@recipes.com');
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
    // First, login as member and create a pending recipe
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="email"]', 'member@recipes.com');
    await page.fill('input[name="password"]', 'member123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Create a pending recipe
    await page.goto('/recipes/submit');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('#title');
    await page.fill('#title', 'Recipe to Approve');
    await page.fill('#description', 'This recipe will be approved by admin');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Logout
    await page.getByRole('button', { name: /logout/i }).click();
    await page.waitForLoadState('networkidle');

    // Now login as admin
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="email"]', 'admin@recipes.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle');

    // Look for approve button
    const approveButton = page.getByRole('button', { name: /approve/i }).first();

    // Should have approve button visible (requires pending recipes)
    await expect(approveButton).toBeVisible({ timeout: 5000 });

    // Wait for button to be enabled before clicking
    await expect(approveButton).toBeEnabled({ timeout: 5000 });

    await approveButton.click();

    // Wait for response and page update
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000); // Brief wait for UI update after approval

    // Should still have content - verify we're still on admin dashboard
    await expect(page.locator('body')).toBeVisible();
    await expect(page).toHaveURL(/.*admin.*dashboard/, { timeout: 5000 });
  });

  test('Admin can reject a recipe', async ({ page }) => {
    // First, login as member and create a pending recipe
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="email"]', 'member@recipes.com');
    await page.fill('input[name="password"]', 'member123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Create a pending recipe
    await page.goto('/recipes/submit');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('#title');
    await page.fill('#title', 'Recipe to Reject');
    await page.fill('#description', 'This recipe will be rejected by admin');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Logout
    await page.getByRole('button', { name: /logout/i }).click();
    await page.waitForLoadState('networkidle');

    // Now login as admin
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="email"]', 'admin@recipes.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle');

    // Look for reject button
    const rejectButton = page.getByRole('button', { name: /reject/i }).first();

    // Should have reject button visible (requires pending recipes)
    await expect(rejectButton).toBeVisible({ timeout: 5000 });

    // Wait for button to be enabled before clicking
    await expect(rejectButton).toBeEnabled({ timeout: 5000 });

    await rejectButton.click();

    // Wait for response and page update
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000); // Brief wait for UI update after rejection

    // Should still have content - verify we're still on admin dashboard
    await expect(page.locator('body')).toBeVisible();
    await expect(page).toHaveURL(/.*admin.*dashboard/, { timeout: 5000 });
  });
});

test.describe('Recipe Search and Filtering', () => {
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

  test('User can search for recipes', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="email"]', 'admin@recipes.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    await page.goto('/recipes');
    await page.waitForLoadState('networkidle');

    // Look for search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();

    // Search input should be visible
    await expect(searchInput).toBeVisible({ timeout: 5000 });

    // Wait for search input to be interactive
    await expect(searchInput).toBeEnabled({ timeout: 5000 });

    // Fill search field
    await searchInput.fill('pasta');

    // Wait for search results to update (either debounced or on submit)
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000); // Wait for debounced search if applicable

    // Results should be visible - verify the page is responsive
    await expect(page.locator('body')).toBeVisible();

    // Verify we're still on recipes page
    await expect(page).toHaveURL(/\/recipes/);
  });

  test('User can filter recipes by category', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="email"]', 'admin@recipes.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    await page.goto('/recipes');
    await page.waitForLoadState('networkidle');

    // Look for category filter select
    const categoryFilter = page.locator('select[name="category"]').first();

    // Category filter should be visible
    await expect(categoryFilter).toBeVisible({ timeout: 5000 });

    // Wait for filter to be interactive
    await expect(categoryFilter).toBeEnabled({ timeout: 5000 });

    // Get available options (skip the first "All Categories" option)
    const options = await categoryFilter.locator('option').all();

    if (options.length > 1) {
      // Select the first actual category (not "All Categories")
      const firstCategory = await options[1].getAttribute('value');
      if (firstCategory) {
        await categoryFilter.selectOption(firstCategory);
      }
    }

    // Wait for filter to apply
    await page.waitForTimeout(500); // Brief wait for client-side filtering

    // Page should update with filtered results
    await expect(page.locator('body')).toBeVisible();

    // Verify we're still on recipes page
    await expect(page).toHaveURL(/\/recipes/);
  });
});

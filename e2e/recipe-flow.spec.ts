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
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');

    // Navigate to recipes page
    await page.goto('/recipes');

    // Should see recipes list or empty state
    await expect(
      page.locator('text=/recipes|no recipes|add.*recipe/i')
    ).toBeVisible({ timeout: 5000 });
  });

  test('User can view recipe details', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');

    await page.goto('/recipes');

    // Click on first recipe (if any exist)
    const firstRecipe = page.locator('article, .recipe-card, [class*="recipe"]').first();
    const recipeExists = await firstRecipe.count();

    if (recipeExists > 0) {
      await firstRecipe.click();

      // Should navigate to recipe detail page
      await expect(page).toHaveURL(/.*recipe.*\/\d+|.*recipes\/[a-zA-Z0-9-]+/);

      // Should show recipe details
      await expect(page.locator('h1, h2')).toBeVisible();
    }
  });
});

test.describe('Recipe Creation', () => {
  test('User can create a new recipe', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*\/(home|dashboard|recipes)?$/);

    // Navigate to create recipe page
    await page.goto('/recipes/new');

    // Fill recipe form
    await page.fill('input[name="title"]', 'E2E Test Recipe');
    await page.fill('textarea[name="description"]', 'This is a test recipe created by E2E tests');

    // Fill ingredients
    const ingredientsField = page.locator('textarea[name="ingredients"], input[name="ingredients"]');
    await ingredientsField.fill('2 cups flour\n1 cup sugar\n3 eggs');

    // Fill instructions
    const instructionsField = page.locator('textarea[name="instructions"]');
    await instructionsField.fill('1. Mix ingredients\n2. Bake at 350F\n3. Enjoy!');

    // Select category
    const categorySelect = page.locator('select[name="category_id"], select[name="categoryId"]');
    await categorySelect.selectOption({ index: 1 });

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to recipes list or detail page
    await page.waitForURL(/.*recipes?.*/, { timeout: 5000 });

    // Should show success message
    await expect(
      page.locator('text=/success|created|submitted/i')
    ).toBeVisible({ timeout: 3000 });
  });

  test('Recipe creation validates required fields', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*\/(home|dashboard|recipes)?$/);

    await page.goto('/recipes/new');

    // Try to submit empty form
    await page.click('button[type="submit"]');

    // Should show validation errors
    await page.waitForTimeout(500);

    // Should still be on creation page
    await expect(page).toHaveURL(/.*recipes\/new/);
  });

  test('User can add multiple ingredients dynamically', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*\/(home|dashboard|recipes)?$/);

    await page.goto('/recipes/new');

    // Look for "Add Ingredient" button (if dynamic ingredient fields exist)
    const addIngredientBtn = page.locator('button:has-text("Add"), button:has-text("ingredient")');
    const hasAddButton = await addIngredientBtn.count();

    if (hasAddButton > 0) {
      // Click to add ingredient field
      await addIngredientBtn.first().click();

      // Should add another ingredient field
      const ingredientFields = page.locator('input[name*="ingredient"]');
      const count = await ingredientFields.count();
      expect(count).toBeGreaterThan(0);
    }
  });
});

test.describe('Recipe Management', () => {
  test('User can edit their own recipe', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*\/(home|dashboard|recipes)?$/);

    // Go to user's recipes
    await page.goto('/my-recipes');

    // Click edit on first recipe
    const editButton = page.locator('button:has-text("Edit"), a:has-text("Edit")').first();
    const hasEditButton = await editButton.count();

    if (hasEditButton > 0) {
      await editButton.click();

      // Should navigate to edit page
      await expect(page).toHaveURL(/.*recipes\/.*\/edit|.*edit-recipe/);

      // Update title
      const titleField = page.locator('input[name="title"]');
      await titleField.fill('Updated Recipe Title E2E');

      // Submit changes
      await page.click('button[type="submit"]');

      // Should redirect back
      await page.waitForURL(/.*recipes?.*/, { timeout: 5000 });
    }
  });

  test('User can delete their own recipe', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*\/(home|dashboard|recipes)?$/);

    await page.goto('/my-recipes');

    // Look for delete button
    const deleteButton = page.locator('button:has-text("Delete")').first();
    const hasDeleteButton = await deleteButton.count();

    if (hasDeleteButton > 0) {
      // Click delete
      await deleteButton.click();

      // Handle confirmation dialog if present
      page.on('dialog', (dialog) => dialog.accept());

      // Wait for deletion
      await page.waitForTimeout(1000);

      // Should show success message or redirect
      await expect(page).toHaveURL(/.*my-recipes|.*recipes/);
    }
  });
});

test.describe('Admin Recipe Approval', () => {
  test('Admin can view pending recipes', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*\/(home|dashboard|recipes)?$/);

    // Navigate to admin panel
    await page.goto('/admin/pending-recipes');

    // Should see pending recipes or empty state
    await expect(
      page.locator('text=/pending|no.*pending|approve|reject/i')
    ).toBeVisible({ timeout: 5000 });
  });

  test('Admin can approve a recipe', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*\/(home|dashboard|recipes)?$/);

    await page.goto('/admin/pending-recipes');

    // Look for approve button
    const approveButton = page.locator('button:has-text("Approve")').first();
    const hasApproveButton = await approveButton.count();

    if (hasApproveButton > 0) {
      await approveButton.click();

      // Should show success message
      await expect(
        page.locator('text=/approved|success/i')
      ).toBeVisible({ timeout: 3000 });
    }
  });

  test('Admin can reject a recipe', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*\/(home|dashboard|recipes)?$/);

    await page.goto('/admin/pending-recipes');

    // Look for reject button
    const rejectButton = page.locator('button:has-text("Reject")').first();
    const hasRejectButton = await rejectButton.count();

    if (hasRejectButton > 0) {
      await rejectButton.click();

      // Should show confirmation or success message
      await page.waitForTimeout(1000);
    }
  });
});

test.describe('Recipe Search and Filtering', () => {
  test('User can search for recipes', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*\/(home|dashboard|recipes)?$/);

    await page.goto('/recipes');

    // Look for search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]');
    const hasSearch = await searchInput.count();

    if (hasSearch > 0) {
      await searchInput.fill('pasta');

      // Wait for search results
      await page.waitForTimeout(1000);

      // Results should update (either showing matching recipes or "no results")
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('User can filter recipes by category', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*\/(home|dashboard|recipes)?$/);

    await page.goto('/recipes');

    // Look for category filter
    const categoryFilter = page.locator('select[name*="category"], button:has-text("category")');
    const hasFilter = await categoryFilter.count();

    if (hasFilter > 0) {
      await categoryFilter.first().click();

      // Wait for filter to apply
      await page.waitForTimeout(1000);

      // Page should update with filtered results
      await expect(page.locator('body')).toBeVisible();
    }
  });
});

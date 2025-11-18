# E2E Test Failure Analysis & Recommendations

## Current Status
- **16 failing tests** - All timeout trying to find Login/Register links
- **29 passing tests** - Accessibility and validation tests (use `goto` directly)

## Debug Logs Added
1. **AuthRestoration.tsx** - Logs when auth restoration runs and results
2. **Header.tsx** - Logs auth state on every render

## Root Cause Analysis

### Primary Issue: Parallel Test Execution
```typescript
// playwright.config.ts
fullyParallel: true,
workers: process.env.CI ? 1 : undefined  // ← Undefined locally = PARALLEL!
```

When running `npx playwright test` locally:
- Multiple workers run tests in parallel
- Each worker has its own browser context
- `context.clearCookies()` only clears cookies in THAT context
- **Shared backend state** (database refresh_tokens table) persists across workers

### Secondary Issue: Missing Cleanup
Tests that login (e.g., line 113) do NOT logout at the end, leaving:
- Browser cookies in that worker's context
- **Database refresh tokens** that persist across tests
- Backend session state that affects subsequent tests

## Test Execution Logs to Check

When you run the tests with debug logs, look for:

```
[AuthRestoration] Starting auth restoration...
[AuthRestoration] ✅ Auth restored successfully for: admin@recipes.com
[Header] Rendering with auth state: { isAuthenticated: true, userEmail: 'admin@recipes.com' }
```

**If you see this on the FIRST test** (line 20), it means:
- A refresh token cookie exists from a previous test run
- Or database still has valid refresh tokens
- AuthRestoration successfully restored the session
- Header shows logged-in UI instead of Login/Register links

## Recommendations

### Option 1: Force Sequential Execution (Quick Fix)
```bash
# Run with a single worker
npx playwright test --project="Desktop Chrome" --workers=1
```

This ensures tests run one at a time, preventing parallel pollution.

### Option 2: Add Proper Test Cleanup (Recommended)

Create a helper function in `e2e/helpers.ts`:

```typescript
export async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.fill('input[name="email"]', 'admin@recipes.com');
  await page.fill('input[name="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle');

  // Verify login succeeded
  await expect(
    page.getByRole('button', { name: /logout/i })
  ).toBeVisible({ timeout: 5000 });
}

export async function logout(page: Page) {
  const logoutButton = page.getByRole('button', { name: /logout/i });

  // Only logout if logged in
  if (await logoutButton.isVisible({ timeout: 1000 }).catch(() => false)) {
    await logoutButton.click();
    await page.waitForLoadState('networkidle');

    // Verify logout succeeded
    await expect(
      page.getByRole('link', { name: 'Login' })
    ).toBeVisible({ timeout: 5000 });

    console.log('[Test Helper] ✅ Logout verified');
  }
}
```

Then update tests:

```typescript
test('User can login with valid credentials', async ({ page }) => {
  await loginAsAdmin(page);

  // Test assertions...

  // CLEANUP: Always logout at the end
  await logout(page);
});

test.afterEach(async ({ page }) => {
  // Safety net: ensure logout even if test fails
  await logout(page).catch(() => {
    console.log('[Test Cleanup] Already logged out or logout failed');
  });
});
```

### Option 3: Clear Database Refresh Tokens (Most Thorough)

Add a test endpoint to backend:

```typescript
// backend/src/controllers/testController.ts
export const clearRefreshTokens = async (req: Request, res: Response) => {
  if (process.env.NODE_ENV !== 'test' && process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ error: 'Only available in test/dev' });
  }

  await db('refresh_tokens').delete();
  res.json({ success: true, message: 'All refresh tokens cleared' });
};
```

Then in E2E tests:

```typescript
test.beforeEach(async ({ context, request }) => {
  // Clear browser cookies
  await context.clearCookies();

  // Clear backend refresh tokens
  await request.post('http://localhost:3001/api/test/clear-tokens');
});
```

### Option 4: Disable AuthRestoration in E2E Tests

Add environment variable check:

```typescript
// AuthRestoration.tsx
useEffect(() => {
  // Skip auth restoration in E2E tests
  if (import.meta.env.VITE_DISABLE_AUTH_RESTORATION === 'true') {
    console.log('[AuthRestoration] Disabled for E2E testing');
    return;
  }

  const restoreAuth = async () => {
    // ... existing code
  };

  restoreAuth();
}, []);
```

Then run E2E tests with:
```bash
VITE_DISABLE_AUTH_RESTORATION=true npx playwright test
```

## Immediate Next Steps

1. **Run a single test with debug logs:**
   ```bash
   npx playwright test --project="Desktop Chrome" --workers=1 auth-flow.spec.ts:20
   ```

2. **Check console output for:**
   - `[AuthRestoration]` logs - Did it restore a session?
   - `[Header]` logs - Is `isAuthenticated: true`?

3. **If auth is being restored on first test:**
   - Database still has refresh tokens from previous runs
   - Need to clear database OR disable AuthRestoration for tests

4. **If auth is NOT being restored but Login link still missing:**
   - Different issue - check if Header is rendering at all
   - Check if there's a frontend error preventing render

## Testing Best Practices Going Forward

1. **Isolation:** Each test should start and end in a clean state
2. **Cleanup:** Tests that login MUST logout (use `afterEach`)
3. **Verification:** Always verify cleanup succeeded before next test
4. **Sequential:** Run auth tests sequentially, not in parallel
5. **Helpers:** Use shared helper functions for login/logout to ensure consistency

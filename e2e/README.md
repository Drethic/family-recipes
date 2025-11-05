# End-to-End Testing with Playwright

This directory contains E2E tests for the Family Recipes application using Playwright.

## Overview

The E2E test suite includes:

- **Desktop Testing**: Full browser testing on Chromium (1280x720)
- **Mobile Testing**: iOS (iPhone 14 Pro) and Android (Pixel 7) emulation
- **Tablet Testing**: iPad Pro in portrait and landscape
- **Accessibility Testing**: WCAG 2.1 Level A & AA compliance with axe-core
- **Responsive Testing**: Custom viewports (320px to 1920px)

## Test Files

```
e2e/
├── accessibility.spec.ts      # Accessibility tests (WCAG compliance, keyboard nav, color contrast)
├── auth-flow.spec.ts          # Authentication (login, register, logout, validation)
├── mobile-responsive.spec.ts  # Mobile-specific tests (touch, navigation, responsive design)
├── recipe-flow.spec.ts        # Recipe CRUD operations and admin workflow
└── README.md                  # This file
```

## Running Tests

### Run All Tests on All Devices

```bash
npm run test:e2e
```

This runs tests across:
- Desktop Chrome
- Mobile Safari (iPhone 14 Pro)
- Mobile Chrome (Pixel 7)
- iPad Pro
- Custom viewports (320px, 768px, 1920px)

### Run Tests on Specific Device

```bash
# Desktop only
npm run test:e2e -- --project="Desktop Chrome"

# Mobile only
npm run test:e2e -- --project="Mobile Safari"

# Tablet only
npm run test:e2e -- --project="Tablet iPad Pro"
```

### Run Specific Test File

```bash
# Run only accessibility tests
npm run test:e2e e2e/accessibility.spec.ts

# Run only auth tests on mobile
npm run test:e2e e2e/auth-flow.spec.ts -- --project="Mobile Safari"
```

### Debug Mode (UI Mode)

```bash
# Open Playwright UI for interactive debugging
npm run test:e2e:ui
```

This opens a browser where you can:
- See test execution in real-time
- Pause and step through tests
- Inspect DOM at any point
- View network requests
- See console logs

### Run Tests in Headed Mode (See Browser)

```bash
npm run test:e2e -- --headed
```

### Generate Test Report

```bash
# Run tests and generate HTML report
npm run test:e2e

# View report
npm run test:e2e:report
```

Report is saved to `playwright-report/index.html`

## Mobile Device Emulation

Playwright emulates real mobile devices with high fidelity:

- **Viewport**: Exact screen resolution for each device
- **User Agent**: Proper mobile browser identification
- **Touch Events**: Tap, swipe, pinch gestures
- **Device Scale Factor**: Correct pixel density
- **Orientation**: Portrait and landscape modes

### Supported Devices

| Device | Viewport | Orientation |
|--------|----------|-------------|
| iPhone 14 Pro | 393x852 | Portrait & Landscape |
| Pixel 7 | 412x915 | Portrait & Landscape |
| iPad Pro | 1024x1366 | Portrait & Landscape |
| Small Mobile | 320x568 | Portrait |
| Tablet | 768x1024 | Portrait |
| Desktop Wide | 1920x1080 | - |

### Add Custom Device

Edit `playwright.config.ts`:

```typescript
{
  name: 'Custom Device',
  use: {
    ...devices['Desktop Chrome'],
    viewport: { width: 375, height: 667 },
    hasTouch: true,
    isMobile: true,
  },
}
```

## Accessibility Testing

Tests check for:

- **WCAG 2.1 Level A & AA** compliance
- **Color contrast** ratios (4.5:1 for normal text)
- **Keyboard navigation** (Tab, Enter, Escape)
- **ARIA labels** and roles
- **Alt text** on images
- **Focus indicators**
- **Touch target size** (minimum 44x44px on mobile)

### Running Only Accessibility Tests

```bash
npm run test:e2e e2e/accessibility.spec.ts
```

### Excluding Known Issues

If a third-party widget has accessibility issues you can't fix:

```typescript
const results = await new AxeBuilder({ page })
  .exclude('#third-party-widget')
  .analyze();
```

### Check Specific WCAG Tags

```typescript
const results = await new AxeBuilder({ page })
  .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
  .analyze();
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

## Best Practices

### 1. Use Test IDs for Stable Selectors

```typescript
// Instead of:
await page.click('button:has-text("Submit")');

// Use data-testid:
await page.click('[data-testid="submit-button"]');
```

### 2. Wait for Network Idle

```typescript
await page.goto('/recipes');
await page.waitForLoadState('networkidle');
```

### 3. Handle Authentication

Create a setup file to login once and reuse the session:

```typescript
// auth.setup.ts
test('authenticate', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password');
  await page.click('button[type="submit"]');
  await page.context().storageState({ path: 'auth.json' });
});

// In playwright.config.ts
use: {
  storageState: 'auth.json',
}
```

### 4. Mobile-Specific Testing

```typescript
test('should work on mobile', async ({ page, isMobile }) => {
  if (!isMobile) {
    test.skip();
    return;
  }

  // Mobile-specific test logic
  await page.tap('[data-testid="mobile-menu"]');
});
```

### 5. Accessibility Testing After Interactions

```typescript
// Check accessibility after form interaction
await page.fill('input[name="email"]', 'test@example.com');

const results = await new AxeBuilder({ page }).analyze();
expect(results.violations).toEqual([]);
```

## Troubleshooting

### Tests Failing Due to Timeout

Increase timeout in `playwright.config.ts`:

```typescript
timeout: 60 * 1000, // 60 seconds
```

### Flaky Tests

Use explicit waits:

```typescript
// Wait for element to be visible
await page.waitForSelector('[data-testid="recipe-card"]');

// Wait for network request
await page.waitForResponse((response) => response.url().includes('/api/recipes'));
```

### Debugging Failed Tests

```bash
# Run with trace on
npm run test:e2e -- --trace on

# View trace
npx playwright show-trace trace.zip
```

### Mobile Tests Not Working

Ensure `isMobile` and `hasTouch` are set:

```typescript
use: {
  ...devices['iPhone 14 Pro'],
  isMobile: true,
  hasTouch: true,
}
```

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Mobile Emulation](https://playwright.dev/docs/emulation)
- [Playwright Accessibility Testing](https://playwright.dev/docs/accessibility-testing)
- [axe-core Rules](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

## Next Steps

1. **Add authentication setup** to reuse login sessions
2. **Add visual regression tests** with `await expect(page).toHaveScreenshot()`
3. **Add API mocking** for consistent test data
4. **Add performance tests** with Playwright's performance APIs
5. **Integrate with CI/CD** pipeline (GitHub Actions, GitLab CI, etc.)

## Writing New Tests

Template for new test file:

```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should do something', async ({ page }) => {
    // Arrange
    await page.click('[data-testid="some-button"]');

    // Act
    await page.fill('input[name="field"]', 'value');
    await page.click('button[type="submit"]');

    // Assert
    await expect(page.locator('.success-message')).toBeVisible();

    // Accessibility check
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});
```

Happy testing! 🎭

import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Testing Configuration
 *
 * This config includes:
 * - Desktop browser testing (Chromium)
 * - Mobile device emulation (iPhone 14, Pixel 7)
 * - Tablet device emulation (iPad Pro)
 * - Accessibility testing with axe-core
 * - Parallel execution for faster CI/CD
 */
export default defineConfig({
  // Test directory
  testDir: './e2e',

  // Maximum time one test can run for
  timeout: 30 * 1000,

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,

  // Reporter to use
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
    ['json', { outputFile: 'playwright-report/results.json' }]
  ],

  // Shared settings for all the projects below
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: process.env.BASE_URL || 'http://localhost:5173',

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',
  },

  // Configure projects for major browsers and devices
  projects: [
    // ========================================
    // DESKTOP TESTING
    // ========================================
    {
      name: 'Desktop Chrome',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
    },

    // Uncomment when WebKit is available
    // {
    //   name: 'Desktop Safari',
    //   use: {
    //     ...devices['Desktop Safari'],
    //     viewport: { width: 1280, height: 720 },
    //   },
    // },

    // ========================================
    // MOBILE TESTING - iOS
    // ========================================
    {
      name: 'Mobile Safari',
      use: {
        ...devices['iPhone 14 Pro'],
        // Additional mobile-specific settings
        hasTouch: true,
        isMobile: true,
      },
    },

    {
      name: 'Mobile Safari Landscape',
      use: {
        ...devices['iPhone 14 Pro landscape'],
        hasTouch: true,
        isMobile: true,
      },
    },

    // ========================================
    // MOBILE TESTING - Android
    // ========================================
    {
      name: 'Mobile Chrome',
      use: {
        ...devices['Pixel 7'],
        hasTouch: true,
        isMobile: true,
      },
    },

    {
      name: 'Mobile Chrome Landscape',
      use: {
        ...devices['Pixel 7 landscape'],
        hasTouch: true,
        isMobile: true,
      },
    },

    // ========================================
    // TABLET TESTING
    // ========================================
    {
      name: 'Tablet iPad Pro',
      use: {
        ...devices['iPad Pro'],
        hasTouch: true,
        isMobile: false, // Tablets are not considered mobile for user agent
      },
    },

    {
      name: 'Tablet iPad Pro Landscape',
      use: {
        ...devices['iPad Pro landscape'],
        hasTouch: true,
        isMobile: false,
      },
    },

    // ========================================
    // RESPONSIVE TESTING - Custom Viewports
    // ========================================
    {
      name: 'Small Mobile (320px)',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 320, height: 568 },
        hasTouch: true,
        isMobile: true,
      },
    },

    {
      name: 'Tablet Portrait (768px)',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 768, height: 1024 },
        hasTouch: true,
      },
    },

    {
      name: 'Desktop Wide (1920px)',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },
  ],

  // Run your local dev server before starting the tests
  webServer: {
    command: 'cd frontend && npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});

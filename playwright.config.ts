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

  // Global setup - wait for app to be ready
  globalSetup: './e2e/global-setup.ts',

  // Maximum time one test can run for (increased for CI)
  timeout: process.env.CI ? 60 * 1000 : 30 * 1000,

  // Global timeout for all tests
  globalTimeout: process.env.CI ? 30 * 60 * 1000 : 20 * 60 * 1000,

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,

  // Expect timeout
  expect: {
    timeout: process.env.CI ? 10 * 1000 : 5 * 1000,
  },

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

    // Navigation timeout
    navigationTimeout: process.env.CI ? 30 * 1000 : 15 * 1000,

    // Action timeout
    actionTimeout: process.env.CI ? 10 * 1000 : 5 * 1000,
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
  // In CI, docker compose already starts the services, so we skip webServer
  webServer: process.env.CI
    ? undefined
    : {
        command: 'cd frontend && npm run dev',
        url: 'http://localhost:5173',
        reuseExistingServer: true,
        timeout: 120 * 1000,
      },
});

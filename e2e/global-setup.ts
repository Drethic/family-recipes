import { chromium, FullConfig } from '@playwright/test';

/**
 * Global Setup for Playwright E2E Tests
 *
 * This setup runs before all tests to ensure the application is ready.
 * It waits for the frontend and backend to be accessible before starting tests.
 */
async function globalSetup(config: FullConfig): Promise<void> {
  const baseURL = config.use?.baseURL || 'http://localhost:5173';
  const maxRetries = 30; // 30 attempts
  const retryDelay = 2000; // 2 seconds between attempts

  console.log(`\n🔍 Waiting for application to be ready at ${baseURL}...`);

  const browser = await chromium.launch();
  const page = await browser.newPage();

  let attempts = 0;
  let appReady = false;

  while (attempts < maxRetries && !appReady) {
    try {
      attempts++;
      console.log(`   Attempt ${attempts}/${maxRetries}...`);

      const response = await page.goto(baseURL, {
        waitUntil: 'networkidle',
        timeout: 10000,
      });

      if (response && response.status() < 400) {
        // Check if page has content
        const bodyVisible = await page.locator('body').isVisible();
        if (bodyVisible) {
          console.log(`✅ Application is ready! (Status: ${response.status()})`);
          appReady = true;
        } else {
          console.log(`   Page loaded but body not visible, retrying...`);
        }
      } else {
        console.log(`   Got status ${response?.status()}, retrying...`);
      }
    } catch (error) {
      const err = error as Error;
      console.log(`   Error: ${err.message}`);

      if (attempts < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    }
  }

  await browser.close();

  if (!appReady) {
    throw new Error(
      `Application not ready after ${maxRetries} attempts at ${baseURL}. ` +
        `Please ensure the frontend and backend services are running.`
    );
  }

  console.log('🚀 Starting E2E tests...\n');
}

export default globalSetup;

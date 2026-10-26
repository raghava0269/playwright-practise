// @ts-check
import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import { STORAGE_STATE } from './utils/constants';

/**
 * .env — load environment variables (URLs, credentials) from a .env file.
 * Copy .env.example to .env and change values per environment.
 * The `|| 'default'` fallbacks keep CI working even without a .env file.
 */
dotenv.config({ path: path.resolve(__dirname, '.env') });

export default defineConfig({
  testDir: './tests',

  /* Max time one test can run (incl. hooks & fixtures). */
  timeout: 30_000,

  /* Default timeout for every expect() auto-retrying assertion. */
  expect: { timeout: 5_000 },

  /* PARALLEL EXECUTION: run tests inside a file in parallel too (not only files). */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,

  /* RETRIES: re-run a failed test. Pass on retry => reported as "flaky". */
  retries: process.env.CI ? 2 : 1,

  /* WORKERS: number of parallel OS processes. undefined = half your CPU cores. */
  workers: process.env.CI ? 2 : undefined,

  /* REPORTS: several reporters can run at once. */
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],

  /* Shared settings for ALL projects (each project can override). */
  use: {
    /* TRACE: 'on' | 'off' | 'retain-on-failure' | 'on-first-retry'. Open with: npx playwright show-trace <zip> */
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    /* TEST IDs: page.getByTestId('x') will look for [data-test="x"] (saucedemo uses data-test). */
    testIdAttribute: 'data-test',

    actionTimeout: 10_000,
    navigationTimeout: 20_000,
  },

  projects: [
    /* 1. SETUP project: logs in once and saves cookies to STORAGE_STATE. */
    {
      name: 'setup',
      testDir: './tests/setup',
      testMatch: /.*\.setup\.js/,
      use: { baseURL: process.env.UI_BASE_URL || 'https://www.saucedemo.com' },
    },

    /* 2. UI projects: depend on setup and reuse its logged-in storage state. */
    {
      name: 'ui-chromium',
      testDir: './tests/ui',
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.UI_BASE_URL || 'https://www.saucedemo.com',
        storageState: STORAGE_STATE,
      },
    },
    {
      name: 'ui-firefox',
      testDir: './tests/ui',
      dependencies: ['setup'],
      grepInvert: /@chromium-only/, // TAGS: skip tests tagged @chromium-only on firefox
      use: {
        ...devices['Desktop Firefox'],
        baseURL: process.env.UI_BASE_URL || 'https://www.saucedemo.com',
        storageState: STORAGE_STATE,
      },
    },

    /* 3. API project: no browser needed, only the `request` fixture. */
    {
      name: 'api',
      testDir: './tests/api',
      use: {
        baseURL: process.env.API_BASE_URL || 'https://jsonplaceholder.typicode.com',
        extraHTTPHeaders: {
          Accept: 'application/json',
        },
      },
    },
  ],
});

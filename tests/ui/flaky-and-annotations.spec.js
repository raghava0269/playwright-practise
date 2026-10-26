import { test, expect } from '@playwright/test';

/**
 * RETRIES & FLAKY TESTS + ANNOTATIONS (skip / fixme / fail / slow)
 *
 * A FLAKY test fails sometimes and passes other times (timing, network,
 * shared data). When a test fails then passes on retry, Playwright reports
 * it as "flaky" (not "passed"). The trace is recorded on the first retry
 * (trace: 'on-first-retry' in config) so you can debug what went wrong.
 */
test.describe('Retries demo', { tag: '@flaky' }, () => {
  // Override retries just for this describe block.
  test.describe.configure({ retries: 2 });

  test('fails on first attempt, passes on retry -> reported as FLAKY', async ({ page }, testInfo) => {
    await page.goto('/');
    console.log(`attempt #${testInfo.retry + 1}`);
    // Simulated flakiness: only the first attempt fails.
    expect(testInfo.retry, 'deliberately failing the first attempt').toBeGreaterThan(0);
  });
});

test.describe('Annotations', () => {
  test.skip('skip: never runs', async () => {});

  test.fixme('fixme: known bug, skipped until fixed', async () => {});

  test('fail: we EXPECT this to fail (passes when it fails)', async () => {
    test.fail();
    expect(1 + 1).toBe(3);
  });

  test('slow: triples the timeout for this test', async ({ page }) => {
    test.slow();
    await page.goto('/');
    await expect(page).toHaveTitle('Swag Labs');
  });

  test('conditional skip: only runs on chromium', { tag: '@chromium-only' }, async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Chromium-only feature');
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
  });
});

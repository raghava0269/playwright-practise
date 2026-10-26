import { test, expect } from '@playwright/test';

/**
 * MOCKING APIs with page.route()
 *   route.fulfill() -> return a fake response (backend never called)
 *   route.fetch()   -> call the real backend, then modify the response
 *   route.abort()   -> block the request (e.g. images, analytics)
 * Demo app: https://demo.playwright.dev/api-mocking fetches /api/v1/fruits
 */
const FRUITS_APP = 'https://demo.playwright.dev/api-mocking';
const FRUITS_API = '*/**/api/v1/fruits';

test.describe('API mocking', { tag: '@mock' }, () => {
  test('fulfill: replace the API response with fake data', async ({ page }) => {
    await page.route(FRUITS_API, async (route) => {
      await route.fulfill({ json: [{ name: 'Mocked Mango', id: 1 }] });
    });

    await page.goto(FRUITS_APP);
    await expect(page.getByText('Mocked Mango')).toBeVisible();
    await expect(page.getByRole('listitem')).toHaveCount(1);
  });

  test('fetch + modify: add an item to the real response', async ({ page }) => {
    await page.route(FRUITS_API, async (route) => {
      const response = await route.fetch(); // real call
      const json = await response.json();
      json.push({ name: 'Playwright Papaya', id: 999 });
      await route.fulfill({ response, json });
    });

    await page.goto(FRUITS_APP);
    await expect(page.getByText('Playwright Papaya')).toBeVisible();
    await expect(page.getByText('Strawberry')).toBeVisible(); // real data still there
  });

  test('fulfill: simulate a server error (500)', async ({ page }) => {
    await page.route(FRUITS_API, (route) =>
      route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'boom' }) })
    );

    // Wait for the (mocked) response and assert on it.
    const responsePromise = page.waitForResponse(FRUITS_API);
    await page.goto(FRUITS_APP);
    const response = await responsePromise;
    expect(response.status()).toBe(500);
    await expect(page.getByRole('listitem')).toHaveCount(0);
  });

  test('abort: block all images on saucedemo', async ({ page }) => {
    await page.route('**/*.{png,jpg,jpeg,svg}', (route) => route.abort());

    await page.goto('/inventory.html'); // logged in through storageState
    const firstImg = page.getByTestId('inventory-item').first().getByRole('img');
    // naturalWidth is 0 when the image failed to load
    await expect.poll(() => firstImg.evaluate((img) => img.naturalWidth)).toBe(0);
  });
});

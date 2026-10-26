import { test, expect } from '@playwright/test';

/**
 * BUILT-IN FIXTURES, AUTO-WAITING, ASYNC/AWAIT, BUILT-IN LOCATORS, ASSERTION TYPES
 *
 * Built-in fixtures Playwright gives every test:
 *   page        - a fresh tab (isolated per test)
 *   context     - the BrowserContext (cookies/storage) that owns `page`
 *   browser     - the shared browser instance (worker-scoped)
 *   browserName - 'chromium' | 'firefox' | 'webkit'
 *   request     - APIRequestContext for HTTP calls
 *   baseURL     - from config `use.baseURL`
 *   testInfo    - 2nd argument: info about the running test
 */
test.describe('Built-in fixtures', { tag: '@fixtures' }, () => {
  test('page, context, browser, browserName, baseURL', async ({ page, context, browser, browserName, baseURL }) => {
    console.log(`browser=${browserName} version=${browser.version()} baseURL=${baseURL}`);

    await page.goto('/inventory.html');
    // storageState from the setup project put the session cookie in this context
    const cookies = await context.cookies();
    expect(cookies.map((c) => c.name)).toContain('session-username');

    // A context can hold several pages (tabs) that share the login session.
    const secondTab = await context.newPage();
    await secondTab.goto('/cart.html');
    await expect(secondTab.getByTestId('title')).toHaveText('Your Cart');
  });

  test('request fixture inside a UI test', async ({ request }) => {
    const response = await request.get('https://jsonplaceholder.typicode.com/todos/1');
    expect(response.ok()).toBeTruthy();
  });

  test('testInfo: details about the running test', async ({}, testInfo) => {
    expect(testInfo.title).toBe('testInfo: details about the running test');
    expect(testInfo.project.name).toMatch(/^ui-/);
    testInfo.annotations.push({ type: 'info', description: 'custom annotation shows in the HTML report' });
  });
});

test.describe('Auto-waiting & async', { tag: '@autowait' }, () => {
  test('actions and web-first assertions wait automatically', async ({ page }) => {
    // Every Playwright call returns a Promise -> always `await` it.
    // Forgetting `await` is the #1 source of flaky tests.
    await page.goto('https://the-internet.herokuapp.com/dynamic_loading/1');
    await page.getByRole('button', { name: 'Start' }).click();

    // "Hello World!" appears after ~5s. No sleep needed:
    // toBeVisible() keeps retrying until it passes or the timeout is hit.
    await expect(page.getByRole('heading', { name: 'Hello World!' })).toBeVisible({ timeout: 10_000 });
  });

  test('never use hard waits — wait for a condition instead', async ({ page }) => {
    await page.goto('https://the-internet.herokuapp.com/dynamic_controls');
    await page.getByRole('button', { name: 'Enable' }).click();
    // BAD:  await page.waitForTimeout(5000);
    // GOOD: assert the state you need — Playwright waits for it.
    const input = page.locator('#input-example input');
    await expect(input).toBeEnabled({ timeout: 10_000 });
    await input.fill('typed after auto-wait');
    await expect(input).toHaveValue('typed after auto-wait');
  });
});

test.describe('Built-in locators', { tag: '@locators' }, () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('getByRole / getByPlaceholder / getByText / getByTestId / locator', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible(); // by ARIA role (preferred)
    await expect(page.getByPlaceholder('Username')).toBeEditable();          // by placeholder
    await expect(page.getByText('Accepted usernames are:')).toBeVisible();   // by visible text
    await expect(page.getByTestId('login-button')).toBeVisible();            // by data-test (testIdAttribute)
    await expect(page.locator('#user-name')).toBeVisible();                  // CSS fallback
    await expect(page.locator('//input[@id="password"]')).toBeVisible();     // XPath fallback

    // Chaining & filtering
    const credentials = page.getByTestId('login-credentials');
    await expect(credentials.filter({ hasText: 'standard_user' })).toBeVisible();
  });
});

test.describe('Assertion types', { tag: '@assertions' }, () => {
  test('web-first (auto-retrying) assertions on locators & page', async ({ page }) => {
    await page.goto('/inventory.html');

    await expect(page).toHaveTitle('Swag Labs');
    await expect(page).toHaveURL(/inventory/);
    const firstName = page.getByTestId('inventory-item-name').first();
    await expect(firstName).toBeVisible();
    await expect(firstName).toHaveText('Sauce Labs Backpack');
    await expect(firstName).toContainText('Backpack');
    await expect(page.getByTestId('inventory-item')).toHaveCount(6);
    await expect(page.getByTestId('product-sort-container')).toHaveValue('az');
    await expect(page.getByTestId('add-to-cart-sauce-labs-backpack')).toHaveAttribute('name', 'add-to-cart-sauce-labs-backpack');
    await expect(page.getByTestId('add-to-cart-sauce-labs-backpack')).toHaveClass(/btn_inventory/);
    await expect(page.getByTestId('shopping-cart-badge')).not.toBeVisible(); // negation
  });

  test('generic (non-retrying) value assertions', async () => {
    const product = { name: 'Backpack', price: 29.99, tags: ['bag', 'sauce'] };

    expect(product.name).toBe('Backpack');                        // strict equality
    expect(product).toEqual({ name: 'Backpack', price: 29.99, tags: ['bag', 'sauce'] }); // deep equality
    expect(product).toMatchObject({ name: 'Backpack' });         // partial match
    expect(product).toHaveProperty('price', 29.99);
    expect(product.tags).toContain('bag');
    expect(product.tags).toHaveLength(2);
    expect(product.price).toBeGreaterThan(20);
    expect(product.price).toBeLessThanOrEqual(30);
    expect(0.1 + 0.2).toBeCloseTo(0.3);
    expect(product.name).toMatch(/back/i);
    expect(undefined).toBeUndefined();
    expect(null).toBeNull();
    expect(product).toBeTruthy();
    expect(() => JSON.parse('{bad')).toThrow();
  });

  test('expect.poll and expect.toPass for custom retry logic', async ({ page }) => {
    await page.goto('/inventory.html');
    // expect.poll: retry a FUNCTION until its value matches
    await expect.poll(async () => page.getByTestId('inventory-item').count()).toBe(6);

    // toPass: retry a whole BLOCK of code until it stops throwing
    await expect(async () => {
      await page.getByTestId('add-to-cart-sauce-labs-backpack').click();
      await expect(page.getByTestId('shopping-cart-badge')).toHaveText('1');
    }).toPass({ timeout: 10_000 });
  });
});

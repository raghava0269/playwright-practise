import { test, expect } from '../../fixtures/fixtures';
import { isSortedAscending, isSortedDescending } from '../../utils/helpers';

/**
 * Concepts: ALL 4 HOOKS, SOFT ASSERTIONS, test.step, storage state (already
 * logged in — no login code here!), utils for generic checks.
 *
 * Hook order per worker:  beforeAll -> [beforeEach -> test -> afterEach] x N -> afterAll
 * With fullyParallel each test may run in a different worker, so beforeAll /
 * afterAll can run once PER WORKER — watch the console output.
 */
test.describe('Inventory', { tag: '@inventory' }, () => {
  test.beforeAll(async ({ browserName }) => {
    // Runs once per worker before the tests. Only worker-scoped fixtures
    // (browser, browserName ...) are allowed here — no `page`.
    console.log(`[beforeAll] inventory suite starting on ${browserName}`);
  });

  test.beforeEach(async ({ inventoryPage }) => {
    await inventoryPage.open();
  });

  test.afterEach(async ({ page }, testInfo) => {
    // testInfo gives status, retry count, duration... Attach a screenshot on failure.
    if (testInfo.status !== testInfo.expectedStatus) {
      await testInfo.attach('failure-screenshot', {
        body: await page.screenshot(),
        contentType: 'image/png',
      });
    }
    await page.evaluate(() => localStorage.removeItem('cart-contents'));
  });

  test.afterAll(async () => {
    console.log('[afterAll] inventory suite finished');
  });

  test('TC06: inventory shows 6 products', { tag: '@smoke' }, async ({ inventoryPage }) => {
    await expect(inventoryPage.title).toHaveText('Products');
    await expect(inventoryPage.items).toHaveCount(6);
  });

  test('TC07: sort products by price low to high', { tag: '@regression' }, async ({ inventoryPage }) => {
    await inventoryPage.sortBy('lohi');
    const prices = await inventoryPage.getAllPrices();
    expect(isSortedAscending(prices)).toBeTruthy();
  });

  test('TC08: sort products by name Z to A', { tag: '@regression' }, async ({ inventoryPage }) => {
    await inventoryPage.sortBy('za');
    const names = await inventoryPage.getAllNames();
    expect(isSortedDescending(names)).toBe(true);
    expect(names[0]).toBe('Test.allTheThings() T-Shirt (Red)');
  });

  test('TC09: add and remove items updates the cart badge', { tag: '@smoke' }, async ({ inventoryPage }) => {
    await test.step('add two products', async () => {
      await inventoryPage.addToCart('Sauce Labs Backpack');
      await inventoryPage.addToCart('Sauce Labs Onesie');
      await expect(inventoryPage.cartBadge).toHaveText('2');
    });

    await test.step('remove one product', async () => {
      await inventoryPage.removeFromCart('Sauce Labs Backpack');
      await expect(inventoryPage.cartBadge).toHaveText('1');
    });

    await test.step('remove last product -> badge disappears', async () => {
      await inventoryPage.removeFromCart('Sauce Labs Onesie');
      await expect(inventoryPage.cartBadge).toBeHidden();
    });
  });

  test('TC10: first product card details (soft assertions)', { tag: '@regression' }, async ({ inventoryPage }) => {
    const firstItem = inventoryPage.items.first();

    // SOFT ASSERTIONS: a failure is recorded but the test keeps going,
    // so you see ALL broken checks in one run. Test is still marked failed.
    await expect.soft(firstItem.getByTestId('inventory-item-name')).toHaveText('Sauce Labs Backpack');
    await expect.soft(firstItem.getByTestId('inventory-item-price')).toHaveText('$29.99');
    await expect.soft(firstItem.getByRole('img')).toBeVisible();
    await expect.soft(firstItem.getByRole('button', { name: 'Add to cart' })).toBeEnabled();

    // Stop here if any soft assertion above failed.
    expect(test.info().errors).toHaveLength(0);
  });
});

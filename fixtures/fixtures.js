import { test as base, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { ApiClient } from '../utils/apiClient';
import { readJson } from '../utils/helpers';

/**
 * CUSTOM FIXTURES
 * ---------------
 * Built-in fixtures: page, context, browser, browserName, request, baseURL ...
 * Here we EXTEND the base `test` with our own fixtures. A test just asks for
 * them by name: test('x', async ({ loginPage, apiClient }) => { ... })
 *
 * Each fixture = setup code -> await use(value) -> teardown code.
 * Fixtures are lazy: they only run if a test actually requests them.
 */
export const test = base.extend({
  // ---- Page Object fixtures (test-scoped: new instance per test) ----
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  inventoryPage: async ({ page }, use) => {
    await use(new InventoryPage(page));
  },

  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },

  checkoutPage: async ({ page }, use) => {
    await use(new CheckoutPage(page));
  },

  // ---- Fixture with setup + teardown ----
  // Opens the inventory page (already logged in via storageState),
  // and after the test clears the cart so tests don't affect each other.
  shopPage: async ({ page }, use) => {
    const inventoryPage = new InventoryPage(page);
    await inventoryPage.open();
    await use(inventoryPage); // <-- the test runs here
    await page.evaluate(() => localStorage.removeItem('cart-contents')); // teardown
  },

  // ---- API fixture built on the built-in `request` fixture ----
  apiClient: async ({ request }, use) => {
    await use(new ApiClient(request));
  },

  // ---- Worker-scoped fixture: created ONCE per worker process, shared by its tests ----
  checkoutData: [
    async ({}, use) => {
      await use(readJson('test-data/checkout.json'));
    },
    { scope: 'worker' },
  ],

  // ---- Automatic fixture: runs for every test without being requested ----
  logTestName: [
    async ({}, use, testInfo) => {
      console.log(`▶ START [worker ${testInfo.workerIndex}] ${testInfo.title}`);
      await use();
      console.log(`■ END   ${testInfo.title} -> ${testInfo.status}`);
    },
    { auto: true },
  ],
});

export { expect };

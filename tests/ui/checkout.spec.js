import { test, expect } from '../../fixtures/fixtures';
import { roundTo } from '../../utils/helpers';

/**
 * Concepts: END-TO-END flow with several page objects, custom fixtures with
 * teardown (shopPage) and worker-scoped data (checkoutData), test.step.
 */
test.describe('Checkout', { tag: '@checkout' }, () => {
  test('TC11: complete checkout end to end', { tag: ['@smoke', '@e2e'] }, async ({ shopPage, cartPage, checkoutPage, checkoutData, page }) => {
    const { customer, products } = checkoutData;

    await test.step('add products to cart', async () => {
      for (const product of products) {
        await shopPage.addToCart(product);
      }
      await shopPage.openCart();
      await expect(cartPage.itemNames).toHaveText(products); // array = exact list in order
    });

    await test.step('enter customer details', async () => {
      await cartPage.checkout();
      await checkoutPage.fillDetails(customer);
      await expect(page).toHaveURL(/checkout-step-two/);
    });

    await test.step('verify totals: subtotal + tax = total', async () => {
      const subtotal = await checkoutPage.getAmount(checkoutPage.subtotalLabel);
      const tax = await checkoutPage.getAmount(checkoutPage.taxLabel);
      const total = await checkoutPage.getAmount(checkoutPage.totalLabel);
      expect(subtotal).toBeCloseTo(29.99 + 9.99, 2); // floats: never use toBe for money math
      expect(roundTo(subtotal + tax)).toBeCloseTo(total, 2);
    });

    await test.step('finish order', async () => {
      await checkoutPage.finish();
      await expect(checkoutPage.completeHeader).toHaveText('Thank you for your order!');
    });
  });

  test('TC12: checkout shows error when first name is missing', { tag: '@regression' }, async ({ shopPage, cartPage, checkoutPage }) => {
    await shopPage.addToCart('Sauce Labs Backpack');
    await shopPage.openCart();
    await cartPage.checkout();
    await checkoutPage.fillDetails({ firstName: '', lastName: 'Bada', postalCode: '500001' });

    await expect(checkoutPage.errorMessage).toHaveText('Error: First Name is required');
  });
});

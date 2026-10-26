import { test, expect } from '../../fixtures/fixtures';
import { readJson } from '../../utils/helpers';
import { EMPTY_STORAGE_STATE } from '../../utils/constants';

/**
 * Concepts: DATA-DRIVEN tests, TAGS, beforeEach HOOK, overriding STORAGE STATE,
 * custom page-object FIXTURE (loginPage).
 */

// The UI projects start logged in (storageState). Login tests need a
// logged-out browser, so override it for this whole file.
test.use({ storageState: EMPTY_STORAGE_STATE });

const users = readJson('test-data/loginUsers.json');

test.describe('Login', { tag: '@login' }, () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.open();
  });

  // DATA-DRIVEN: one test generated per row of loginUsers.json (TC01 - TC04)
  for (const user of users) {
    test(`${user.id}: login with ${user.title}`, { tag: user.shouldLogin ? '@smoke' : '@regression' }, async ({ page, loginPage }) => {
      await loginPage.login(user.username, user.password);

      if (user.shouldLogin) {
        await expect(page).toHaveURL(/inventory\.html/);
      } else {
        await expect(loginPage.errorMessage).toBeVisible();
        await expect(loginPage.errorMessage).toContainText(user.error);
        await expect(page).toHaveURL(/saucedemo\.com\/?$/);
      }
    });
  }

  test('TC05: user can log out', { tag: ['@smoke', '@regression'] }, async ({ page, loginPage, inventoryPage }) => {
    await loginPage.login('standard_user', 'secret_sauce');
    await inventoryPage.logout();
    await expect(loginPage.loginButton).toBeVisible();
    await expect(page).not.toHaveURL(/inventory/);
  });
});

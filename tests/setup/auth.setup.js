import { test as setup, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { STORAGE_STATE, USERS } from '../../utils/constants';

/**
 * STORAGE STATE
 * Log in ONCE, save cookies/localStorage to a JSON file. The UI projects
 * load that file (use.storageState in the config), so every test starts
 * already logged in — no need to log in inside each test.
 */
setup('authenticate as standard_user', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.open();
  await loginPage.login(USERS.standard, USERS.password);
  await expect(page).toHaveURL(/inventory/);

  await page.context().storageState({ path: STORAGE_STATE });
});

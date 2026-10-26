import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page);
    // BUILT-IN LOCATORS: getByPlaceholder / getByRole / getByTestId
    this.usernameInput = page.getByPlaceholder('Username');
    this.passwordInput = page.getByPlaceholder('Password');
    this.loginButton = page.getByRole('button', { name: 'Login' });
    this.errorMessage = page.getByTestId('error'); // -> [data-test="error"]
  }

  async open() {
    await this.navigate('/');
  }

  async login(username, password) {
    // AUTO-WAITING: fill/click wait until the element is visible, enabled & stable.
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }
}

/**
 * BasePage — common actions every page object inherits.
 * Page objects hold LOCATORS + ACTIONS. Assertions stay in the tests.
 */
export class BasePage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
  }

  /** baseURL from playwright.config.js is prepended to relative paths. */
  async navigate(path = '/') {
    await this.page.goto(path);
  }

  async getTitle() {
    return this.page.title();
  }
}

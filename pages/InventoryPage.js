import { BasePage } from './BasePage';

export class InventoryPage extends BasePage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page);
    this.title = page.getByTestId('title');
    this.items = page.getByTestId('inventory-item');
    this.itemNames = page.getByTestId('inventory-item-name');
    this.itemPrices = page.getByTestId('inventory-item-price');
    this.sortDropdown = page.getByTestId('product-sort-container');
    this.cartBadge = page.getByTestId('shopping-cart-badge');
    this.cartLink = page.getByTestId('shopping-cart-link');
    this.menuButton = page.getByRole('button', { name: 'Open Menu' });
    this.logoutLink = page.getByTestId('logout-sidebar-link'); // <a> without href has no 'link' role
  }

  async open() {
    await this.navigate('/inventory.html');
  }

  /** "Sauce Labs Backpack" -> clicks [data-test="add-to-cart-sauce-labs-backpack"] */
  async addToCart(productName) {
    await this.page.getByTestId(`add-to-cart-${this.#slug(productName)}`).click();
  }

  async removeFromCart(productName) {
    await this.page.getByTestId(`remove-${this.#slug(productName)}`).click();
  }

  /** @param {'az'|'za'|'lohi'|'hilo'} option */
  async sortBy(option) {
    await this.sortDropdown.selectOption(option);
  }

  async getAllNames() {
    return this.itemNames.allTextContents();
  }

  async getAllPrices() {
    const texts = await this.itemPrices.allTextContents();
    return texts.map((t) => parseFloat(t.replace('$', '')));
  }

  async openCart() {
    await this.cartLink.click();
  }

  async logout() {
    await this.menuButton.click();
    await this.logoutLink.click();
  }

  #slug(name) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
}

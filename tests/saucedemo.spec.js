import { test, expect } from '@playwright/test';

test('page has correct title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Swag Labs');
});

test('URL is correct', async({ page }) =>{
await page.goto('/');
await expect(page).toHaveURL('https://www.saucedemo.com/');
});

test('Login button is visible', async({page}) =>{
await page.goto('/');
await expect(page.getByRole('button',{name: 'Login'})).toBeVisible();
});

test('User can login', async({ page}) =>{
const username = 'Standard_user';
const password='secret_sauce';
await page.goto('/');
await page.getByPlaceholder('Username').fill(username);
await page.getByPlaceholder('Password').fill(password);
await page.getByRole('button',{name:'Login'}).click();
await expect(page).toHaveURL(/inventory/);
});
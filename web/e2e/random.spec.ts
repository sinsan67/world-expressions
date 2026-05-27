import { test, expect } from '@playwright/test';

// /random est un server component qui appelle le backend Render.
// Vercel staging peut bloquer les routes SSR sans bypass token.
// Passer VERCEL_BYPASS_TOKEN=<token> pour que ces tests passent en staging.
// En local (BASE_URL=http://localhost:3000) ils passent sans token.

const API_TIMEOUT = 90_000;

test.describe('Page /random', () => {
  test('redirige vers une page expression', async ({ page }) => {
    await page.goto('/random');
    await expect(page).toHaveURL(/\/expression\//, { timeout: API_TIMEOUT });
  });

  test('deux appels successifs donnent des expressions potentiellement différentes', async ({ page }) => {
    await page.goto('/random');
    await expect(page).toHaveURL(/\/expression\//, { timeout: API_TIMEOUT });
    const url1 = page.url();

    await page.goto('/random');
    await expect(page).toHaveURL(/\/expression\//, { timeout: API_TIMEOUT });
    const url2 = page.url();

    expect(url1).toMatch(/\/expression\//);
    expect(url2).toMatch(/\/expression\//);
  });
});

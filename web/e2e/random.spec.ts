import { test, expect } from '@playwright/test';

test.describe('Page /random', () => {
  test('redirige vers une page expression', async ({ page }) => {
    await page.goto('/random');
    // Le server component redirige vers /expression/[id]
    await expect(page).toHaveURL(/\/expression\//, { timeout: 30_000 });
  });

  test('deux appels successifs donnent des expressions potentiellement différentes', async ({ page }) => {
    await page.goto('/random');
    await expect(page).toHaveURL(/\/expression\//, { timeout: 30_000 });
    const url1 = page.url();

    await page.goto('/random');
    await expect(page).toHaveURL(/\/expression\//, { timeout: 30_000 });
    const url2 = page.url();

    // Les deux URLs sont des pages expression valides (même si par chance identiques)
    expect(url1).toMatch(/\/expression\//);
    expect(url2).toMatch(/\/expression\//);
  });
});

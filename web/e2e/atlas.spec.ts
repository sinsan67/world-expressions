import { test, expect } from '@playwright/test';

// Les cartes Atlas nécessitent un appel API (Render staging cold start ~60s)
const API_TIMEOUT = 90_000;

test.describe('Page /atlas', () => {
  test('se charge et affiche les cartes pays', async ({ page }) => {
    await page.goto('/atlas');
    await expect(page.locator('a[href*="/country/"]').first()).toBeVisible({ timeout: API_TIMEOUT });
  });

  test('affiche au moins 10 pays', async ({ page }) => {
    await page.goto('/atlas');
    await page.locator('a[href*="/country/"]').first().waitFor({ timeout: API_TIMEOUT });
    const cards = page.locator('a[href*="/country/"]');
    expect(await cards.count()).toBeGreaterThanOrEqual(10);
  });

  test('le clic sur un pays navigue vers /country/[code]', async ({ page }) => {
    await page.goto('/atlas');
    await page.locator('a[href*="/country/"]').first().waitFor({ timeout: API_TIMEOUT });
    await page.locator('a[href*="/country/"]').first().click();
    await expect(page).toHaveURL(/\/country\//);
  });
});

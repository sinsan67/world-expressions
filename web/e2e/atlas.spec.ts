import { test, expect } from '@playwright/test';

test.describe('Page /atlas', () => {
  test('se charge et affiche les cartes pays', async ({ page }) => {
    await page.goto('/atlas');
    // Attend que des cartes pays apparaissent
    await expect(page.locator('a[href*="/country/"]').first()).toBeVisible({ timeout: 20_000 });
  });

  test('affiche au moins 10 pays', async ({ page }) => {
    await page.goto('/atlas');
    await page.waitForSelector('a[href*="/country/"]', { timeout: 20_000 });
    const cards = page.locator('a[href*="/country/"]');
    expect(await cards.count()).toBeGreaterThanOrEqual(10);
  });

  test('le clic sur un pays navigue vers /country/[code]', async ({ page }) => {
    await page.goto('/atlas');
    await page.waitForSelector('a[href*="/country/"]', { timeout: 20_000 });
    await page.locator('a[href*="/country/"]').first().click();
    await expect(page).toHaveURL(/\/country\//);
  });
});

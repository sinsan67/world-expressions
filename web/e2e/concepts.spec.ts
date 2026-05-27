import { test, expect } from '@playwright/test';

const API_TIMEOUT = 90_000;

test.describe('Page /concepts', () => {
  test('se charge et affiche la grille de concepts', async ({ page }) => {
    await page.goto('/concepts');
    // Les concepts sont des liens href="/#q=..." générés depuis l'API
    await expect(page.locator('a[href^="/#q="]').first()).toBeVisible({ timeout: API_TIMEOUT });
  });

  test('affiche au moins 20 concepts', async ({ page }) => {
    await page.goto('/concepts');
    await page.locator('a[href^="/#q="]').first().waitFor({ timeout: API_TIMEOUT });
    const count = await page.locator('a[href^="/#q="]').count();
    expect(count).toBeGreaterThanOrEqual(20);
  });

  test('le clic sur un concept redirige vers la homepage avec recherche', async ({ page }) => {
    await page.goto('/concepts');
    await page.locator('a[href^="/#q="]').first().waitFor({ timeout: API_TIMEOUT });
    await page.locator('a[href^="/#q="]').first().click();
    await expect(page).toHaveURL(/\/#q=/);
  });
});

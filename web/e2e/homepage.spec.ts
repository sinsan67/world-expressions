import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('se charge et affiche la barre de recherche', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('input[type="text"], input[type="search"]').first()).toBeVisible();
  });

  test('l\'expression du moment se charge', async ({ page }) => {
    await page.goto('/');
    // La postcard apparaît après fetch API — on attend jusqu'à 30s (cold start)
    await expect(page.locator('[class*="postcard"], [class*="featured"]').first()).toBeVisible({ timeout: 30_000 });
  });

  test('une recherche retourne des résultats', async ({ page }) => {
    await page.goto('/');
    const input = page.locator('input[type="text"], input[type="search"]').first();
    await input.fill('argent');
    await input.press('Enter');
    // Au moins une carte d'expression visible
    await expect(page.locator('[class*="card"], article').first()).toBeVisible({ timeout: 15_000 });
  });

  test('le lien Atlas de la nav fonctionne', async ({ page }) => {
    await page.goto('/');
    await page.click('a[href="/atlas"]');
    await expect(page).toHaveURL(/\/atlas/);
  });

  test('le lien Concepts de la nav fonctionne', async ({ page }) => {
    await page.goto('/');
    await page.click('a[href="/concepts"]');
    await expect(page).toHaveURL(/\/concepts/);
  });
});

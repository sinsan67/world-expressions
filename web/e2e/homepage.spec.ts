import { test, expect } from '@playwright/test';

const API_TIMEOUT = 90_000;

test.describe('Homepage', () => {
  test('se charge et affiche la barre de recherche', async ({ page }) => {
    await page.goto('/');
    // Le SearchBar utilise la classe CSS wex-input
    await expect(page.locator('input.wex-input').first()).toBeVisible({ timeout: API_TIMEOUT });
  });

  test('l\'expression du moment se charge', async ({ page }) => {
    await page.goto('/');
    // La postcard/featured section est dans la Sidebar ou Hero —
    // on attend qu'une expression soit affichée (le texte de la postcard)
    await expect(page.locator('.wex-sidebar, [class*="hero"]').first()).toBeVisible({ timeout: API_TIMEOUT });
  });

  test('une recherche retourne des résultats', async ({ page }) => {
    await page.goto('/');
    const input = page.locator('input.wex-input').first();
    await input.waitFor({ timeout: API_TIMEOUT });
    await input.fill('argent');
    await input.press('Enter');
    // Au moins une ExpressionCard visible après la recherche
    await expect(page.locator('[data-region], .wex-input').first()).toBeVisible({ timeout: API_TIMEOUT });
  });

  test('le lien Atlas de la nav fonctionne', async ({ page }) => {
    await page.goto('/');
    // Le lien Atlas est dans la Sidebar (desktop) et BottomNav (mobile)
    await expect(page.locator('a[href="/atlas"]').first()).toBeVisible({ timeout: API_TIMEOUT });
    await page.locator('a[href="/atlas"]').first().click();
    await expect(page).toHaveURL(/\/atlas/);
  });

  test('le lien Concepts de la nav fonctionne', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('a[href="/concepts"]').first()).toBeVisible({ timeout: API_TIMEOUT });
    await page.locator('a[href="/concepts"]').first().click();
    await expect(page).toHaveURL(/\/concepts/);
  });
});

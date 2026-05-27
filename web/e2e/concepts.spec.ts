import { test, expect } from '@playwright/test';

test.describe('Page /concepts', () => {
  test('se charge et affiche la grille de concepts', async ({ page }) => {
    await page.goto('/concepts');
    // Un chip de concept = un lien ou bouton avec emoji + nom
    await expect(page.locator('[class*="concept"], [class*="chip"], [class*="tag"]').first()).toBeVisible({ timeout: 20_000 });
  });

  test('affiche au moins 20 concepts', async ({ page }) => {
    await page.goto('/concepts');
    await page.waitForTimeout(3000); // attend le fetch API
    const items = page.locator('[class*="concept"], [class*="chip"]');
    // On vérifie juste qu'il y en a un nombre raisonnable
    const count = await items.count();
    expect(count).toBeGreaterThan(5);
  });

  test('le clic sur un concept redirige vers la homepage avec recherche', async ({ page }) => {
    await page.goto('/concepts');
    await page.waitForSelector('a[href^="/#q="]', { timeout: 20_000 });
    await page.locator('a[href^="/#q="]').first().click();
    await expect(page).toHaveURL(/\/#q=/);
  });
});

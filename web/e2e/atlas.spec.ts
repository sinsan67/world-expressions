import { test, expect } from '@playwright/test';

const T = 90_000;

test.describe('Page /atlas', () => {
  test('#18 se charge et affiche les 14 cartes pays', async ({ page }) => {
    await page.goto('/atlas');
    await page.locator('a[href*="/country/"]').first().waitFor({ timeout: T });
    const cards = page.locator('a[href*="/country/"]');
    expect(await cards.count()).toBeGreaterThanOrEqual(1);
  });

  test('#21 clic sur un pays navigue vers /country/[code]', async ({ page }) => {
    await page.goto('/atlas');
    await page.locator('a[href*="/country/"]').first().waitFor({ timeout: T });
    await page.locator('a[href*="/country/"]').first().click();
    await expect(page).toHaveURL(/\/country\//);
  });

  // Lot N1 (atelier S208 décision 2) : Atlas est sorti de la nav persistante,
  // reléguée à la section "Explorer le monde" du hub — #22/#23 vérifiaient sa
  // surbrillance dans la nav, elles vérifient maintenant son absence.
  test('#22 "Atlas" est absent de la sidebar (sorti de la nav persistante, Lot N1)', async ({ page }) => {
    await page.goto('/atlas');
    await expect(page.locator('.wex-sidebar a[href="/atlas"]')).toHaveCount(0);
  });

  test('#23 "Atlas" est absent de la BottomNav mobile (sorti de la nav persistante, Lot N1)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/atlas');
    await expect(page.locator('[data-testid="bottom-nav"] a[href="/atlas"]')).toHaveCount(0);
  });
});

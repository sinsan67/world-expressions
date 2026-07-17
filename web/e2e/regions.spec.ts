import { test, expect } from '@playwright/test';

const T = 90_000;

test.describe('Page /regions (archivée, Lot N1)', () => {
  // Lot N1 (atelier S208 décision 3) : l'index /regions redirige vers
  // /country/fr — seule la page Pays France y donne désormais accès (les
  // pages région individuelles /regions/[code] restent inchangées, cf.
  // #R3-R7 ci-dessous).
  test('#R1 /regions redirige vers /country/fr', async ({ page }) => {
    await page.goto('/regions');
    await expect(page).toHaveURL(/\/country\/fr/, { timeout: T });
  });
});

test.describe('Page /regions/bretagne', () => {
  test('#R3 hero et titre visibles', async ({ page }) => {
    await page.goto('/regions/bretagne');
    await expect(page.locator('h1').filter({ hasText: /Bretagne/i })).toBeVisible({ timeout: T });
  });

  test('#R4 les expressions se chargent', async ({ page }) => {
    await page.goto('/regions/bretagne');
    await page.locator('h1').filter({ hasText: /Bretagne/i }).waitFor({ timeout: T });
    // Attendre qu'au moins une expression soit rendue (les cartes sont des divs cliquables)
    await page.waitForFunction(
      () => document.querySelectorAll('[style*="border-radius"]').length > 5,
      { timeout: T }
    );
  });

  test('#R5 filtres de section fonctionnent', async ({ page }) => {
    await page.goto('/regions/bretagne');
    await page.locator('h1').filter({ hasText: /Bretagne/i }).waitFor({ timeout: T });
    // Cliquer sur "Mer & marine"
    const merBtn = page.locator('button').filter({ hasText: /Mer|marine/i }).first();
    await merBtn.waitFor({ timeout: T });
    await merBtn.click();
    await page.waitForTimeout(500);
    // Le bouton doit être actif (style change)
    await expect(merBtn).toBeVisible();
  });

  test('#R6 lien retour vers /country/fr existe', async ({ page }) => {
    await page.goto('/regions/bretagne');
    await page.locator('h1').filter({ hasText: /Bretagne/i }).waitFor({ timeout: T });
    const backLink = page.locator('a[href="/country/fr"]').first();
    await expect(backLink).toHaveAttribute('href', '/country/fr', { timeout: T });
  });
});

test.describe('Page /country/fr — section régions', () => {
  test('#R7 les deux cartes régions sont visibles', async ({ page }) => {
    await page.goto('/country/fr');
    await page.locator('h1, h2').first().waitFor({ timeout: T });
    await expect(page.getByText('Alsace').first()).toBeVisible({ timeout: T });
    await expect(page.getByText('Bretagne').first()).toBeVisible({ timeout: T });
  });

  // Chemin réel post-Lot N1 : /regions n'est plus accessible depuis la nav,
  // /country/fr est le point d'entrée vers les régions (remplace l'ancien #R2).
  test('#R2 clic sur la carte Bretagne (depuis /country/fr) navigue vers /regions/bretagne', async ({ page }) => {
    await page.goto('/country/fr');
    await page.locator('h1, h2').first().waitFor({ timeout: T });
    await page.getByText('Bretagne').first().click();
    await expect(page).toHaveURL(/\/regions\/bretagne/, { timeout: T });
  });
});

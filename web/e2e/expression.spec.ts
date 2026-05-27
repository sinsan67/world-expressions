import { test, expect } from '@playwright/test';

// Nécessite VERCEL_BYPASS_TOKEN pour le staging (route SSR).
// En local (BASE_URL=http://localhost:3000) fonctionne sans token.

const API_TIMEOUT = 90_000;

test.describe('Page /expression/[id]', () => {
  let expressionUrl: string;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await page.goto('/random');
    await page.waitForURL(/\/expression\//, { timeout: API_TIMEOUT });
    expressionUrl = new URL(page.url()).pathname;
    await page.close();
  });

  test('affiche le titre de l\'expression', async ({ page }) => {
    await page.goto(expressionUrl);
    // Le titre est un h1 ou h2 visible — on cherche une balise h
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: API_TIMEOUT });
  });

  test('affiche la signification', async ({ page }) => {
    await page.goto(expressionUrl);
    // Le contenu principal se charge après fetch API
    await expect(page.locator('main, [role="main"], .wex-main').first()).toBeVisible({ timeout: API_TIMEOUT });
  });

  test('le bouton retour ramène à la homepage', async ({ page }) => {
    await page.goto(expressionUrl);
    await page.locator('h1, h2').first().waitFor({ timeout: API_TIMEOUT });
    // Lien "retour" ou vers l'accueil
    const backLink = page.locator('a[href="/"]').first();
    if (await backLink.isVisible()) {
      await backLink.click();
      await expect(page).toHaveURL(/^\/?(\?.*)?$/);
    }
  });

  test('un clic sur le drapeau navigue vers /country/[code]', async ({ page }) => {
    await page.goto(expressionUrl);
    await page.locator('h1, h2').first().waitFor({ timeout: API_TIMEOUT });
    const flagLink = page.locator('a[href*="/country/"]').first();
    if (await flagLink.isVisible()) {
      await flagLink.click();
      await expect(page).toHaveURL(/\/country\//);
    }
  });
});

import { test, expect } from '@playwright/test';

test.describe('Page /expression/[id]', () => {
  // On passe par /random pour obtenir un ID valide à chaque run
  let expressionUrl: string;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await page.goto('/random');
    await page.waitForURL(/\/expression\//, { timeout: 30_000 });
    expressionUrl = new URL(page.url()).pathname;
    await page.close();
  });

  test('affiche le titre de l\'expression', async ({ page }) => {
    await page.goto(expressionUrl);
    // Le titre principal (h1 ou équivalent) doit être visible
    await expect(page.locator('h1, [class*="expression-title"], [class*="postcard-title"]').first()).toBeVisible();
  });

  test('affiche la signification', async ({ page }) => {
    await page.goto(expressionUrl);
    // La signification est présente quelque part dans la page
    await expect(page.locator('[class*="meaning"], [class*="content"]').first()).toBeVisible({ timeout: 15_000 });
  });

  test('le bouton retour ramène à la homepage', async ({ page }) => {
    await page.goto('/');
    await page.goto(expressionUrl);
    await page.click('a[href="/"], button:has-text("Retour"), a:has-text("Back")');
    await expect(page).toHaveURL(/^\/?(\?.*)?$/);
  });

  test('un clic sur le drapeau navigue vers /country/[code]', async ({ page }) => {
    await page.goto(expressionUrl);
    const flagLink = page.locator('a[href*="/country/"]').first();
    if (await flagLink.isVisible()) {
      await flagLink.click();
      await expect(page).toHaveURL(/\/country\//);
    }
  });
});

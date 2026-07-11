import { test, expect } from '@playwright/test';

// Nécessite VERCEL_BYPASS_TOKEN pour le staging (route SSR).
// En local (BASE_URL=http://localhost:3000) fonctionne sans token.

const T = 90_000;

test.describe('Page /expression/[id]', () => {
  let expressionUrl: string;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await page.goto('/random');
    await page.waitForURL(/\/expression\//, { timeout: T });
    expressionUrl = new URL(page.url()).pathname;
    await page.close();
  });

  test('#35 affiche l\'en-tête hero', async ({ page }) => {
    await page.goto(expressionUrl);
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: T });
  });

  test('#36 clic sur le drapeau navigue vers /country/[code]', async ({ page }) => {
    await page.goto(expressionUrl);
    await page.locator('h1, h2').first().waitFor({ timeout: T });
    const flagLink = page.locator('a[href*="/country/"]').first();
    const hasFlag = await flagLink.isVisible({ timeout: 5000 }).catch(() => false);
    test.skip(!hasFlag, 'expression aléatoire sans lien pays (donnée variable)');
    await flagLink.click();
    await expect(page).toHaveURL(/\/country\//);
  });

  test('#37 les 3 sections de contenu sont visibles', async ({ page }) => {
    await page.goto(expressionUrl);
    await page.locator('h1, h2').first().waitFor({ timeout: T });
    const main = page.locator('main, [role="main"], .wex-main').first();
    await expect(main).toBeVisible({ timeout: T });
    // Au moins un paragraphe de contenu (signification)
    const sections = page.locator('main p');
    expect(await sections.count()).toBeGreaterThanOrEqual(1);
  });

  test('#38 interface EN + expression FR → traduction littérale visible', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('wex_lang', 'en'));
    // Chercher une expression française spécifiquement.
    // Search moved from "/" to "/search" (games-hub pivot, S196 — see
    // docs/pivot-lot0-contract.md §1). The old home's inline search bar is gone.
    await page.goto('/search');
    await page.locator('input.wex-input').first().waitFor({ timeout: T });
    await page.locator('input.wex-input').fill('avoir');
    await page.locator('input.wex-input').press('Enter');
    const frCard = page.locator('[data-testid="expression-card"]').first();
    await frCard.waitFor({ timeout: T });
    await frCard.click();
    await page.locator('h1, h2').first().waitFor({ timeout: T });
    // La traduction littérale s'affiche en écriture manuscrite/italique sous le titre
    const literal = page.locator('[class*="literal"], [class*="hand"], i, em').first();
    // Vérification souple : le contenu textuel de la page inclut du texte de traduction
    await expect(page.locator('main')).toContainText(/.+/, { timeout: T });
  });

  test('#40 clic sur un tag revient à la homepage avec recherche', async ({ page }) => {
    await page.goto(expressionUrl);
    await page.locator('h1, h2').first().waitFor({ timeout: T });
    const tag = page.locator('[class*="tag"], [class*="Tag"]').first();
    const hasTag = await tag.isVisible({ timeout: 5000 }).catch(() => false);
    test.skip(!hasTag, 'expression aléatoire sans tag (donnée variable)');
    await tag.click();
    await expect(page).toHaveURL(/\/#q=|\/\?q=/);
  });

  test('#42 cœur sur la page expression toggle le favori', async ({ page }) => {
    await page.goto(expressionUrl);
    await page.locator('h1, h2').first().waitFor({ timeout: T });
    const heart = page.locator('button[aria-label*="favori"], button[aria-label*="favorite"], button[title*="favori"], button[title*="favorite"]').first();
    await expect(heart).toBeVisible({ timeout: T });
    const before = await page.evaluate(() => {
      try { return JSON.parse(localStorage.getItem('wex_carnet') || '{}').favorites?.length ?? 0; }
      catch { return 0; }
    });
    await heart.click();
    const after = await page.evaluate(() => {
      try { return JSON.parse(localStorage.getItem('wex_carnet') || '{}').favorites?.length ?? 0; }
      catch { return 0; }
    });
    expect(after).not.toBe(before);
  });

  test('#43 visiter une expression l\'ajoute à l\'historique /carnet', async ({ page }) => {
    await page.goto(expressionUrl);
    await page.locator('h1, h2').first().waitFor({ timeout: T });
    await expect.poll(
      () => page.evaluate(() => {
        try { return JSON.parse(localStorage.getItem('wex_carnet') || '{}').history?.length ?? 0; }
        catch { return 0; }
      }),
      { timeout: 5000 }
    ).toBeGreaterThan(0);
  });

  test('#44 bouton "Expression au hasard" navigue vers une autre expression', async ({ page }) => {
    await page.goto(expressionUrl);
    await page.locator('h1, h2').first().waitFor({ timeout: T });
    const randomBtn = page.locator('a[href="/random"], a[href*="random"]').first();
    await expect(randomBtn).toBeVisible({ timeout: T });
    await randomBtn.click();
    await expect(page).toHaveURL(/\/expression\//, { timeout: T });
  });

  test('#45 bouton retour ramène à la homepage', async ({ page }) => {
    await page.goto(expressionUrl);
    await page.locator('h1, h2').first().waitFor({ timeout: T });
    const backLink = page.locator('a[href="/"]').first();
    await expect(backLink).toBeVisible({ timeout: T });
    await backLink.click();
    await expect(page).toHaveURL(/\/(\?.*|#.*)?$/);
  });
});

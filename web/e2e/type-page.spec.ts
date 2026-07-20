import { test, expect } from '@playwright/test';

// /type/[slug] — pages par type d'expression (proverb, word, locution)
// Feature récente sans couverture de test (Bob 9, chantier 9, point 3)

const T = 90_000;
const CARD = '[data-testid="expression-card"]';

async function switchLang(page: import('@playwright/test').Page, langCode: string) {
  await page.locator('[data-testid="lang-trigger"]').first().click({ timeout: T });
  await page.locator(`[data-testid="lang-option-${langCode}"]`).click({ timeout: T });
}

test.describe('Page /type/[slug]', () => {
  // #T5 lang switch uses the sidebar LangBar which is desktop-only (display:none < 1024px)
  test.use({ viewport: { width: 1280, height: 800 } });

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('wex_lang', 'fr'));
  });

  test('#T1 /type/proverb charge, titre visible et cartes présentes', async ({ page }) => {
    await page.goto('/type/proverb');
    await expect(page.locator('h1').filter({ hasText: /proverbe/i })).toBeVisible({ timeout: T });
    await expect(page.locator(CARD).first()).toBeVisible({ timeout: T });
    expect(await page.locator(CARD).count()).toBeGreaterThan(0);
  });

  test('#T2 /type/word charge, titre visible et cartes présentes', async ({ page }) => {
    await page.goto('/type/word');
    await expect(page.locator('h1').filter({ hasText: /mot/i })).toBeVisible({ timeout: T });
    await expect(page.locator(CARD).first()).toBeVisible({ timeout: T });
  });

  test('#T3 /type/locution charge, titre visible et cartes présentes', async ({ page }) => {
    await page.goto('/type/locution');
    await expect(page.locator('h1').filter({ hasText: /locution/i })).toBeVisible({ timeout: T });
    await expect(page.locator(CARD).first()).toBeVisible({ timeout: T });
  });

  test('#T6 CTA "Jouer avec ces cartes" → /voyage?kind=proverb (Lot N2)', async ({ page }) => {
    await page.goto('/type/proverb');
    const cta = page.getByTestId('play-with-cards');
    await expect(cta).toBeVisible({ timeout: T });
    await expect(cta).toHaveAttribute('href', '/voyage?kind=proverb');
  });

  test('#T7 pas de CTA sur /type/word (le Voyage exclut les mots)', async ({ page }) => {
    await page.goto('/type/word');
    await expect(page.locator(CARD).first()).toBeVisible({ timeout: T });
    await expect(page.getByTestId('play-with-cards')).toHaveCount(0);
  });

  test('#T4 slug invalide redirige vers /', async ({ page }) => {
    await page.goto('/type/slug-invalide');
    await expect(page).toHaveURL('/', { timeout: T });
  });

  test('#T5 lang switch sur /type/proverb re-fetche en nouvelle langue', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('wex_lang', 'en'));
    await page.goto('/type/proverb');
    await expect(page.locator(CARD).first()).toBeVisible({ timeout: T });

    // browseByCountry uses locale= parameter
    const frCallPromise = page.waitForRequest(
      req => req.url().includes('/browse?') && req.url().includes('locale=fr'),
      { timeout: T },
    );
    await switchLang(page, 'fr');
    await frCallPromise;

    // Titre mis à jour en français
    await expect(page.locator('h1').filter({ hasText: /proverbe/i })).toBeVisible({ timeout: T });
  });
});

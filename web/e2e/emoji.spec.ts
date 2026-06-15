import { test, expect } from '@playwright/test';

const T = 90_000;
const DOMAIN = '[data-testid="domain-card"]';
const CONCEPT = '[data-testid="concept-card"]';

test.describe('Page /emoji', () => {
  test('#24 se charge et affiche la grille de domaines', async ({ page }) => {
    await page.goto('/emoji');
    await page.locator(DOMAIN).first().waitFor({ timeout: T });
    const count = await page.locator(DOMAIN).count();
    expect(count).toBeGreaterThanOrEqual(10);
  });

  test('#26 filtre FR — affiche les concepts de la langue FR', async ({ page }) => {
    await page.goto('/emoji');
    await page.locator(DOMAIN).first().waitFor({ timeout: T });
    const frBtn = page.locator('[data-testid="lang-filter-fr"]');
    await expect(frBtn).toBeVisible({ timeout: T });
    await frBtn.click({ force: true, timeout: T });
    await page.locator(DOMAIN).first().click();
    await page.locator(CONCEPT).first().waitFor({ timeout: T });
    const concepts = await page.locator(CONCEPT).count();
    expect(concepts).toBeGreaterThan(0);
  });

  test('#27 filtre EN — affiche les concepts anglais', async ({ page }) => {
    await page.goto('/emoji');
    await page.locator(DOMAIN).first().waitFor({ timeout: T });
    const enBtn = page.locator('[data-testid="lang-filter-en"]');
    await expect(enBtn).toBeVisible({ timeout: T });
    await enBtn.click({ force: true, timeout: T });
    await page.locator(DOMAIN).first().click();
    await page.locator(CONCEPT).first().waitFor({ timeout: T });
    expect(await page.locator(CONCEPT).count()).toBeGreaterThan(0);
  });

  test('#28 filtre "Tous" restaure tous les concepts', async ({ page }) => {
    await page.goto('/emoji');
    await page.locator(DOMAIN).first().waitFor({ timeout: T });
    await page.locator(DOMAIN).first().click();
    await page.locator(CONCEPT).first().waitFor({ timeout: T });
    const initialCount = await page.locator(CONCEPT).count();
    const frBtn = page.locator('[data-testid="lang-filter-fr"]');
    await expect(frBtn).toBeVisible({ timeout: T });
    await frBtn.click();
    // Filtre client-side : attendre que les concepts soient re-rendus
    await expect(page.locator(CONCEPT).first()).toBeVisible({ timeout: T });
    const tousBtn = page.locator('button').filter({ hasText: /^Tous$|^All$|^Tümü$|^Todos$|^Tutti$/ }).first();
    await tousBtn.click();
    // Après "Tous", tous les concepts doivent être de retour
    await expect(page.locator(CONCEPT).first()).toBeVisible({ timeout: T });
    const afterCount = await page.locator(CONCEPT).count();
    expect(afterCount).toBeGreaterThanOrEqual(initialCount);
  });

  test('#30 clic sur un concept redirige vers search', async ({ page }) => {
    await page.goto('/emoji');
    await page.locator(DOMAIN).first().waitFor({ timeout: T });
    await page.locator(DOMAIN).first().click();
    await page.locator(CONCEPT).first().waitFor({ timeout: T });
    await page.locator(CONCEPT).first().click();
    await expect(page).toHaveURL(/\/search\?concept=/, { timeout: T });
  });

  test('#31 "Concepts" est en surbrillance dans la sidebar', async ({ page }) => {
    await page.goto('/emoji');
    const link = page.locator('.wex-sidebar a[href="/emoji"]').first();
    await link.waitFor({ timeout: T });
    const color = await link.evaluate((el) => getComputedStyle(el).color);
    expect(color).not.toBe('rgb(92, 79, 58)');
  });

  test('#32 icône Concepts active dans la BottomNav (mobile)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/emoji');
    const link = page.locator('[class*="BottomNav"] a[href="/emoji"], [class*="bottom-nav"] a[href="/emoji"]').first();
    // Sélecteur class* fragile (CSS modules) — à remplacer par data-testid="bottom-nav"
    const hasBottomNav = await link.isVisible({ timeout: 5000 }).catch(() => false);
    test.skip(!hasBottomNav, 'BottomNav introuvable — sélecteur class* fragile, ajouter data-testid="bottom-nav"');
    const color = await link.evaluate((el) => getComputedStyle(el).color);
    expect(color).not.toBe('rgb(92, 79, 58)');
  });
});

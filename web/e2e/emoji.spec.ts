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

  // Domain cards now navigate to /search?domain= directly (commit 11fa98d).
  // Tests that need concept cards use /emoji?domain=X (URL-based panel still works).
  test('#26 clic domaine → navigue vers /search?domain=', async ({ page }) => {
    await page.goto('/emoji');
    await page.locator(DOMAIN).first().waitFor({ timeout: T });
    await page.locator(DOMAIN).first().click();
    await expect(page).toHaveURL(/\/search\?domain=\w+/, { timeout: T });
  });

  test.fixme('#27 filtre EN — affiche les concepts anglais', async ({ page }) => {
    await page.goto('/emoji?domain=emotions');
    await page.locator(CONCEPT).first().waitFor({ timeout: T });
    const enBtn = page.locator('[data-testid="lang-filter-en"]');
    await expect(enBtn).toBeVisible({ timeout: T });
    await enBtn.click({ force: true, timeout: T });
    await page.locator(CONCEPT).first().waitFor({ timeout: T });
    expect(await page.locator(CONCEPT).count()).toBeGreaterThan(0);
  });

  test('#28 filtre "Tous" restaure tous les concepts', async ({ page }) => {
    await page.goto('/emoji?domain=emotions');
    await page.locator(CONCEPT).first().waitFor({ timeout: T });
    const initialCount = await page.locator(CONCEPT).count();
    const frBtn = page.locator('[data-testid="lang-filter-fr"]');
    await expect(frBtn).toBeVisible({ timeout: T });
    await frBtn.click();
    await expect(page.locator(CONCEPT).first()).toBeVisible({ timeout: T });
    const tousBtn = page.locator('button').filter({ hasText: /^Tous$|^All$|^Tümü$|^Todos$|^Tutti$/ }).first();
    await tousBtn.click();
    await expect(page.locator(CONCEPT).first()).toBeVisible({ timeout: T });
    const afterCount = await page.locator(CONCEPT).count();
    expect(afterCount).toBeGreaterThanOrEqual(initialCount);
  });

  test('#30 clic sur un concept redirige vers search', async ({ page }) => {
    await page.goto('/emoji?domain=emotions');
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
    const link = page.locator('[data-testid="bottom-nav"] a[href="/emoji"]');
    await expect(link).toBeVisible({ timeout: T });
    const color = await link.evaluate((el) => getComputedStyle(el).color);
    expect(color).not.toBe('rgb(92, 79, 58)');
  });
});

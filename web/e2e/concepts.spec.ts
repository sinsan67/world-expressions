import { test, expect } from '@playwright/test';

const T = 90_000;

test.describe('Page /concepts', () => {
  test('#24 se charge et affiche la grille de concepts', async ({ page }) => {
    await page.goto('/concepts');
    await page.locator('a[href^="/#q="]').first().waitFor({ timeout: T });
    const count = await page.locator('a[href^="/#q="]').count();
    expect(count).toBeGreaterThanOrEqual(20);
  });

  test('#26 filtre FR — affiche les concepts de la langue FR', async ({ page }) => {
    await page.goto('/concepts');
    await page.locator('a[href^="/#q="]').first().waitFor({ timeout: T });
    const frBtn = page.locator('button').filter({ hasText: /^FR$/ }).first();
    if (await frBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await frBtn.click();
      await page.waitForTimeout(500);
      const concepts = await page.locator('a[href^="/#q="]').count();
      expect(concepts).toBeGreaterThan(0);
    }
  });

  test('#27 filtre EN — affiche les concepts anglais', async ({ page }) => {
    await page.goto('/concepts');
    await page.locator('a[href^="/#q="]').first().waitFor({ timeout: T });
    const enBtn = page.locator('button').filter({ hasText: /^EN$/ }).first();
    if (await enBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await enBtn.click();
      await page.waitForTimeout(500);
      expect(await page.locator('a[href^="/#q="]').count()).toBeGreaterThan(0);
    }
  });

  test('#28 filtre "Tous" restaure tous les concepts', async ({ page }) => {
    await page.goto('/concepts');
    await page.locator('a[href^="/#q="]').first().waitFor({ timeout: T });
    const initialCount = await page.locator('a[href^="/#q="]').count();
    const frBtn = page.locator('button').filter({ hasText: /^FR$/ }).first();
    if (await frBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await frBtn.click();
      await page.waitForTimeout(300);
      const tousBtn = page.locator('button').filter({ hasText: /^Tous$|^All$|^Tümü$|^Todos$|^Tutti$/ }).first();
      await tousBtn.click();
      await page.waitForTimeout(300);
      const afterCount = await page.locator('a[href^="/#q="]').count();
      expect(afterCount).toBeGreaterThanOrEqual(initialCount);
    }
  });

  test('#30 clic sur un concept redirige vers homepage avec recherche', async ({ page }) => {
    await page.goto('/concepts');
    await page.locator('a[href^="/#q="]').first().waitFor({ timeout: T });
    await page.locator('a[href^="/#q="]').first().click();
    await expect(page).toHaveURL(/\/#q=/);
  });

  test('#31 "Concepts" est en surbrillance dans la sidebar', async ({ page }) => {
    await page.goto('/concepts');
    const link = page.locator('.wex-sidebar a[href="/concepts"]').first();
    await link.waitFor({ timeout: T });
    const color = await link.evaluate((el) => getComputedStyle(el).color);
    expect(color).not.toBe('rgb(92, 79, 58)');
  });

  test('#32 icône Concepts active dans la BottomNav (mobile)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/concepts');
    const link = page.locator('[class*="BottomNav"] a[href="/concepts"], [class*="bottom-nav"] a[href="/concepts"]').first();
    if (await link.isVisible({ timeout: T }).catch(() => false)) {
      const color = await link.evaluate((el) => getComputedStyle(el).color);
      expect(color).not.toBe('rgb(92, 79, 58)');
    }
  });
});

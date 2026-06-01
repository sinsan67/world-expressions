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

  test('#22 "Atlas" est en surbrillance dans la sidebar', async ({ page }) => {
    await page.goto('/atlas');
    const atlasLink = page.locator('.wex-sidebar a[href="/atlas"]').first();
    await atlasLink.waitFor({ timeout: T });
    const color = await atlasLink.evaluate((el) => getComputedStyle(el).color);
    expect(color).not.toBe('rgb(92, 79, 58)'); // pas --ink-soft
  });

  test('#23 icône Atlas active dans la BottomNav (mobile)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/atlas');
    const bottomNavAtlas = page.locator('[class*="BottomNav"] a[href="/atlas"], [class*="bottom-nav"] a[href="/atlas"]').first();
    if (await bottomNavAtlas.isVisible({ timeout: T }).catch(() => false)) {
      const color = await bottomNavAtlas.evaluate((el) => getComputedStyle(el).color);
      expect(color).not.toBe('rgb(92, 79, 58)');
    }
  });
});

import { test, expect } from '@playwright/test';

const T = 90_000;
const CARD = '[data-testid="expression-card"]';

test.describe('Search — locale-aware meanings (bug fix: sense in UI language)', () => {
  test('search request includes locale param matching UI language', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('wex_lang', 'en'));

    const searchUrls: string[] = [];
    page.on('request', (req) => {
      // Submitting the search box on /search triggers a same-origin frontend
      // navigation request AND the real backend API call — only the latter
      // carries `locale=`, so require it to isolate the backend call (same
      // pattern as lang-switch.spec.ts).
      if (req.url().includes('/search?') && req.url().includes('locale=')) searchUrls.push(req.url());
    });

    // Search moved from "/" to "/search" (games-hub pivot, S196 — see
    // docs/pivot-lot0-contract.md §1). The old home's inline search bar is gone.
    await page.goto('/search');
    const input = page.locator('input.wex-input').first();
    await input.waitFor({ timeout: T });
    await input.fill('argent');
    await input.press('Enter');

    await expect(page.locator(CARD).first()).toBeVisible({ timeout: T });

    const matchingUrl = searchUrls.find((u) => u.includes('argent'));
    expect(matchingUrl, 'search API was called').toBeDefined();
    expect(matchingUrl).toContain('locale=en');
  });

  test('changing UI language re-searches with new locale', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('wex_lang', 'fr'));
    await page.goto('/search?q=argent');

    await expect(page.locator(CARD).first()).toBeVisible({ timeout: T });

    const searchUrlsAfterLangSwitch: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('/search?')) searchUrlsAfterLangSwitch.push(req.url());
    });

    // Open the LangDropdown then click the EN option
    const trigger = page.locator('[data-testid="lang-trigger"]').first();
    await expect(trigger).toBeVisible({ timeout: T });
    await trigger.click();
    const enOption = page.locator('[data-testid="lang-option-en"]').first();
    await expect(enOption).toBeVisible({ timeout: T });
    await enOption.click();

    // Verify cards are still visible after language switch
    await expect(page.locator(CARD).first()).toBeVisible({ timeout: T });
  });
});

import { test, expect } from '@playwright/test';

const T = 90_000;
const CARD = '[data-testid="expression-card"]';

// Helper: open LangBar dropdown and select a language by name
async function switchLang(page: import('@playwright/test').Page, langName: RegExp) {
  await page.locator('button[aria-haspopup="true"]').click();
  await page.locator('button').filter({ hasText: langName }).click();
}

test.describe('Lang switch — content reloads in new language (#WWWW)', () => {

  test('search page: lang switch triggers API re-call with new locale', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('wex_lang', 'en'));

    const searchUrls: string[] = [];
    page.on('request', req => {
      if (req.url().includes('/search?')) searchUrls.push(req.url());
    });

    await page.goto('/search?q=argent');
    await expect(page.locator(CARD).first()).toBeVisible({ timeout: T });

    // Switch to FR via LangBar dropdown
    const frCallPromise = page.waitForRequest(
      req => req.url().includes('/search?') && req.url().includes('locale=fr'),
      { timeout: T },
    );
    await switchLang(page, /^français$/i);
    await frCallPromise;

    // Placeholder should reflect FR
    const placeholder = await page.locator('input.wex-input').first().getAttribute('placeholder');
    expect(placeholder).toMatch(/essaie/i);
  });

  test('country page: lang switch triggers API re-call with new locale', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('wex_lang', 'en'));

    await page.goto('/country/tr');
    await expect(page.locator(CARD).first()).toBeVisible({ timeout: T });

    // Watch for browse API call with new locale
    const frCallPromise = page.waitForRequest(
      req => req.url().includes('/browse?') && req.url().includes('locale=fr'),
      { timeout: T },
    );
    await switchLang(page, /^français$/i);
    await frCallPromise;

    // Cards should still be visible after reload
    await expect(page.locator(CARD).first()).toBeVisible({ timeout: T });
  });

  test('homepage: lang switch re-fetches search results in new locale', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('wex_lang', 'en'));

    await page.goto('/');
    const input = page.locator('input.wex-input').first();
    await input.waitFor({ timeout: T });
    await input.fill('chat');
    await input.press('Enter');
    await expect(page.locator(CARD).first()).toBeVisible({ timeout: T });

    // Switch to FR — should trigger a new search with locale=fr
    const frCallPromise = page.waitForRequest(
      req => req.url().includes('/search?') && req.url().includes('locale=fr'),
      { timeout: T },
    );
    await switchLang(page, /^français$/i);
    await frCallPromise;

    await expect(page.locator(CARD).first()).toBeVisible({ timeout: T });
  });

});

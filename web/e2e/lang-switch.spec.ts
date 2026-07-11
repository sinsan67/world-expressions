import { test, expect } from '@playwright/test';

const T = 90_000;
const CARD = '[data-testid="expression-card"]';

// Helper: open LangBar dropdown and select a language by code.
// Uses data-testid selectors to avoid aria-haspopup ambiguity and emoji-in-text issues.
// .first() handles pages where 2 LangDropdown instances coexist (desktop LangBar + mobile header).
async function switchLang(page: import('@playwright/test').Page, langCode: string) {
  await page.locator('[data-testid="lang-trigger"]').first().click({ timeout: T });
  await page.locator(`[data-testid="lang-option-${langCode}"]`).click({ timeout: T });
}

// Expression path retrieved once for the whole describe (avoid repeated /random navigations)
let sharedExpressionPath: string;

test.describe('Lang switch — expression page (#WWWW)', () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await page.goto('/random');
    await page.waitForURL(/\/expression\//, { timeout: T });
    sharedExpressionPath = new URL(page.url()).pathname;
    await page.close();
  });

  test('expression page: lang switch triggers API re-call with new lang', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('wex_lang', 'en'));
    await page.goto(sharedExpressionPath);
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: T });

    // getExpression uses ?lang= (not ?locale= like browse endpoints)
    const frCallPromise = page.waitForRequest(
      req => req.url().includes('/expression/') && req.url().includes('lang=fr'),
      { timeout: T },
    );
    await switchLang(page, 'fr');
    await frCallPromise;

    // Content should still be visible after reload
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: T });
  });
});

test.describe('Lang switch — content reloads in new language (#WWWW)', () => {

  test('search page: lang switch triggers API re-call with new locale', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('wex_lang', 'en'));

    await page.goto('/search?q=argent');
    await expect(page.locator(CARD).first()).toBeVisible({ timeout: T });

    // Switch to FR via LangBar dropdown
    const frCallPromise = page.waitForRequest(
      req => req.url().includes('/search?') && req.url().includes('locale=fr'),
      { timeout: T },
    );
    await switchLang(page, 'fr');
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
    await switchLang(page, 'fr');
    await frCallPromise;

    // Cards should still be visible after reload
    await expect(page.locator(CARD).first()).toBeVisible({ timeout: T });
  });

  // NOTE: the former "homepage: lang switch re-fetches search results in new
  // locale" test lived here — it drove the old home's inline search bar
  // ("/" + input.wex-input), which no longer exists since "/" became the
  // games hub and search moved to "/search" (games-hub pivot, S196 — see
  // docs/pivot-lot0-contract.md §1). It's now a duplicate of the "search
  // page:" test above (same assertion, same endpoint), so it was removed
  // rather than retargeted.

});

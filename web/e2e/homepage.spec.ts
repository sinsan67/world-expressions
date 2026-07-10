import { test, expect } from '@playwright/test';

// "/" is now the games hub (docs/pivot-lot0-contract.md §1, lot A). The old
// inline search UI moved to /search — its own e2e coverage lives in
// search-page.spec.ts. These tests assert the Hub's own DOM: game cards,
// teaser, collection strip, daily postcard, and that the first-visit
// WelcomeModal gate still works.

const T = 90_000;
const VOYAGE_CARD = '[data-testid="game-card-voyage"]';
const REVISION_CARD = '[data-testid="game-card-revision"]';
const TEASER_CARD = '[data-testid="game-card-teaser"]';
const COLLECTION_STRIP = '[data-testid="collection-strip"]';
const DAILY_POSTCARD = '[data-testid="daily-postcard"]';

test.describe('Hub — modal bienvenue', () => {
  test('#1 modal s\'affiche à la première visite', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('wex_lang'));
    await page.reload();
    await expect(page.locator('[role="dialog"]').first()).toBeVisible({ timeout: T });
  });

  test('#2 boutons langue dans le modal changent le CTA', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('wex_lang'));
    await page.reload();
    const modal = page.locator('[role="dialog"]').first();
    await modal.waitFor({ timeout: T });
    // Cliquer FR d'abord pour un état de départ déterministe
    await modal.locator('[data-testid="lang-btn-fr"]').click();
    await expect(modal.locator('button').filter({ hasText: /Commencer/i }).first()).toBeVisible({ timeout: T });
    // Cliquer EN → le CTA doit changer pour "Let's go"
    await modal.locator('[data-testid="lang-btn-en"]').click();
    await expect(modal.locator('button').filter({ hasText: /Let.s go/i }).first()).toBeVisible({ timeout: T });
  });

  test('#3 fermer le modal affiche le hub', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('wex_lang'));
    await page.reload();
    const modal = page.locator('[role="dialog"]').first();
    await modal.waitFor({ timeout: T });
    const cta = modal.locator('button').last();
    await cta.click();
    await expect(modal).not.toBeVisible();
    await expect(page.locator(VOYAGE_CARD).first()).toBeVisible({ timeout: T });
  });

  test('#4 rechargement après visite → pas de modal', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('wex_lang', 'fr'));
    await page.reload();
    await page.locator(VOYAGE_CARD).first().waitFor({ timeout: T });
    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).not.toBeVisible();
  });
});

test.describe('Hub — sections & navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('wex_lang', 'fr'));
    await page.goto('/');
    await page.locator(VOYAGE_CARD).first().waitFor({ timeout: T });
  });

  test('#5 rend le titre + les 2 cartes de jeu + le teaser + la collection + la carte du jour', async ({ page }) => {
    await expect(page.locator('h1')).toBeVisible({ timeout: T });
    await expect(page.locator(VOYAGE_CARD)).toBeVisible({ timeout: T });
    await expect(page.locator(REVISION_CARD)).toBeVisible({ timeout: T });
    await expect(page.locator(TEASER_CARD)).toBeVisible({ timeout: T });
    await expect(page.locator(COLLECTION_STRIP)).toBeVisible({ timeout: T });
    await expect(page.locator(DAILY_POSTCARD)).toBeVisible({ timeout: T });
  });

  test('#6 la carte Voyage navigue vers /voyage', async ({ page }) => {
    await page.locator(VOYAGE_CARD).click();
    await expect(page).toHaveURL(/\/voyage/, { timeout: T });
  });

  test('#7 la carte Révision navigue vers /revision', async ({ page }) => {
    await page.locator(REVISION_CARD).click();
    await expect(page).toHaveURL(/\/revision/, { timeout: T });
  });

  test('#8 la carte postale du jour navigue vers la fiche expression', async ({ page }) => {
    await page.locator(DAILY_POSTCARD).click();
    await expect(page).toHaveURL(/\/expression\//, { timeout: T });
  });

  test('#9 le bandeau collection navigue vers /profile', async ({ page }) => {
    await page.locator(COLLECTION_STRIP).click();
    await expect(page).toHaveURL(/\/profile/, { timeout: T });
  });

  test('#10 la carte du jour est déterministe (même expression au rechargement)', async ({ page }) => {
    const postcard = page.locator(DAILY_POSTCARD);
    const href1 = await postcard.getAttribute('href');
    await page.reload();
    await postcard.waitFor({ timeout: T });
    const href2 = await postcard.getAttribute('href');
    expect(href1).toBeTruthy();
    expect(href1).toBe(href2);
  });
});

test.describe('Hub — i18n', () => {
  test('#11 langue non traduite (de) retombe sur l\'anglais, jamais le français', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('wex_lang', 'de'));
    await page.goto('/');
    await page.waitForFunction(() => document.documentElement.lang === 'de', undefined, { timeout: T });
    const heading = page.locator('h1');
    await expect(heading).toBeVisible({ timeout: T });
    await expect(heading).toContainText('play', { timeout: T });
    await expect(heading).not.toContainText('joue');
  });
});

test.describe('Hub — header mobile (< 1024px)', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('wex_lang', 'fr'));
    await page.goto('/');
    await page.locator(VOYAGE_CARD).first().waitFor({ timeout: T });
  });

  test('#12 icône recherche du header navigue vers /search', async ({ page }) => {
    await page.locator('.wex-mobile-header a[href="/search"]').first().click();
    await expect(page).toHaveURL(/\/search/, { timeout: T });
  });

  test('#13 icône cœur du header navigue vers /profile', async ({ page }) => {
    await page.locator('.wex-mobile-header a[href="/profile"]').first().click();
    await expect(page).toHaveURL(/\/profile/, { timeout: T });
  });
});

test.describe('Hub — navigation sidebar (desktop)', () => {
  // Sidebar is display:none below 1024px — force desktop viewport
  test.use({ viewport: { width: 1280, height: 800 } });

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('wex_lang', 'fr'));
    await page.goto('/');
    await page.locator('.wex-sidebar').first().waitFor({ timeout: T });
  });

  test('#16 clic sur le wordmark de la sidebar reste sur l\'accueil', async ({ page }) => {
    const logo = page.locator('.wex-sidebar a[href="/"]').first();
    await logo.click();
    await expect(page).toHaveURL(/\/(\?.*|#.*)?$/);
  });

  test('#17 "Accueil" est en surbrillance dans la sidebar sur /', async ({ page }) => {
    const homeLink = page.locator('.wex-sidebar a[href="/"]').first();
    await expect(homeLink).toBeVisible({ timeout: T });
    const color = await homeLink.evaluate((el) => getComputedStyle(el).color);
    // La couleur active est --plum, pas la couleur par défaut
    expect(color).not.toBe('rgb(92, 79, 58)'); // --ink-soft
  });
});

test.describe('Hub — BottomNav mobile (< 1024px)', () => {
  // BottomNav is display:none above 1024px — force mobile viewport
  test.use({ viewport: { width: 390, height: 844 } });

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('wex_lang', 'fr'));
    await page.goto('/');
    await page.locator(VOYAGE_CARD).first().waitFor({ timeout: T });
  });

  test('#18 BottomNav est visible sur mobile', async ({ page }) => {
    const nav = page.locator('[data-testid="bottom-nav"]');
    await expect(nav).toBeVisible({ timeout: T });
    // 4 liens de navigation (home, random, atlas, concepts — search ouvre l'overlay via un bouton)
    expect(await nav.locator('a').count()).toBe(4);
  });

  test('#19 lien Accueil dans BottomNav est cliquable', async ({ page }) => {
    const homeLink = page.locator('[data-testid="bottom-nav"] a[href="/"]');
    await expect(homeLink).toBeVisible({ timeout: T });
    await homeLink.click();
    await expect(page).toHaveURL(/\/(\?.*|#.*)?$/);
  });
});

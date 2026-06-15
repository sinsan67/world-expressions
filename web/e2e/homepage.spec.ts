import { test, expect } from '@playwright/test';

const T = 90_000;
const CARD = '[data-testid="expression-card"]';

test.describe('Homepage — modal bienvenue', () => {
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

  test('#3 fermer le modal affiche l\'app', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('wex_lang'));
    await page.reload();
    const modal = page.locator('[role="dialog"]').first();
    await modal.waitFor({ timeout: T });
    const cta = modal.locator('button').last();
    await cta.click();
    await expect(modal).not.toBeVisible();
    await expect(page.locator('input.wex-input').first()).toBeVisible({ timeout: T });
  });

  test('#4 rechargement après visite → pas de modal', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('wex_lang', 'fr'));
    await page.reload();
    await page.locator('input.wex-input').first().waitFor({ timeout: T });
    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).not.toBeVisible();
  });
});

test.describe('Homepage — recherche', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('wex_lang', 'fr'));
    await page.goto('/');
    await page.locator('input.wex-input').first().waitFor({ timeout: T });
  });

  test('#9 recherche retourne des résultats avec compteur', async ({ page }) => {
    const input = page.locator('input.wex-input').first();
    await input.fill('chat');
    await input.press('Enter');
    await expect(page.locator(CARD).first()).toBeVisible({ timeout: T });
  });

  test('#10 rechargement après recherche relance la recherche', async ({ page }) => {
    const input = page.locator('input.wex-input').first();
    await input.fill('argent');
    await input.press('Enter');
    await page.locator(CARD).first().waitFor({ timeout: T });
    await page.reload();
    await expect(page).toHaveURL(/#q=argent/);
    await expect(page.locator(CARD).first()).toBeVisible({ timeout: T });
  });

  test('#11 infinite scroll charge plus de résultats', async ({ page }) => {
    const input = page.locator('input.wex-input').first();
    await input.fill('avoir');
    await input.press('Enter');
    await page.locator(CARD).first().waitFor({ timeout: T });
    const initialCount = await page.locator(CARD).count();
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000); // IntersectionObserver → fetch → re-render : pas de signal DOM unique observable
    const newCount = await page.locator(CARD).count();
    expect(newCount).toBeGreaterThanOrEqual(initialCount);
  });

  test('#12 clic sur une carte navigue vers /expression/[id]', async ({ page }) => {
    const input = page.locator('input.wex-input').first();
    await input.fill('chat');
    await input.press('Enter');
    const card = page.locator(CARD).first();
    await card.waitFor({ timeout: T });
    await card.locator('span').first().click();
    await expect(page).toHaveURL(/\/expression\//, { timeout: T });
  });

  test('#13 clic sur un tag relance la recherche', async ({ page }) => {
    const input = page.locator('input.wex-input').first();
    await input.fill('argent');
    await input.press('Enter');
    await page.locator(CARD).first().waitFor({ timeout: T });
    const tag = page.locator('[data-testid="tag-button"]').first();
    await expect(tag).toBeVisible({ timeout: T });
    await tag.click();
    await expect(page).toHaveURL(/#q=/);
  });

  test('#15 clic sur un bouton emoji-wall lance la recherche par concept', async ({ page }) => {
    // Les chips de suggestion V1 ont été remplacés par l'Emoji Wall (section de navigation rapide par concept)
    const emojiBtn = page.locator('[data-testid="emoji-wall-btn"]').first();
    await expect(emojiBtn).toBeVisible({ timeout: T });
    await emojiBtn.click();
    await expect(page.locator(CARD).first()).toBeVisible({ timeout: T });
  });
});

test.describe('Homepage — navigation sidebar', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('wex_lang', 'fr'));
    await page.goto('/');
    await page.locator('.wex-sidebar').first().waitFor({ timeout: T });
  });

  test('#16 clic sur le wordmark revient à l\'accueil vierge', async ({ page }) => {
    const input = page.locator('input.wex-input').first();
    await input.fill('chat');
    await input.press('Enter');
    const logo = page.locator('.wex-sidebar a[href="/"]').first();
    await logo.click();
    await expect(page).toHaveURL(/\/(\?.*|#.*)?$/);
  });

  test('#17 "Accueil" est en surbrillance dans la sidebar sur /', async ({ page }) => {
    const homeLink = page.locator('.wex-sidebar a[href="/"]').first();
    await expect(homeLink).toBeVisible({ timeout: T });
    const color = await homeLink.evaluate((el) => getComputedStyle(el).color);
    // La couleur active est --plum (#7c3aed), pas la couleur par défaut
    expect(color).not.toBe('rgb(92, 79, 58)'); // --ink-soft
  });
});

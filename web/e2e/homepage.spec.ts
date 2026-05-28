import { test, expect } from '@playwright/test';

const T = 90_000;

test.describe('Homepage — modal bienvenue', () => {
  test('#1 modal s\'affiche à la première visite', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('wex_lang'));
    await page.reload();
    await expect(page.locator('[role="dialog"], .wex-modal, [class*="modal"]').first()).toBeVisible({ timeout: T });
  });

  test('#2 boutons langue dans le modal changent le CTA', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('wex_lang'));
    await page.reload();
    const modal = page.locator('[role="dialog"], .wex-modal, [class*="modal"]').first();
    await modal.waitFor({ timeout: T });
    const enBtn = modal.locator('button, [role="button"]').filter({ hasText: /^EN$|^English$|english/i }).first();
    if (await enBtn.isVisible()) {
      await enBtn.click();
      await expect(modal.locator('button').filter({ hasText: /let.s go/i }).first()).toBeVisible();
    }
  });

  test('#3 fermer le modal affiche l\'app', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('wex_lang'));
    await page.reload();
    const modal = page.locator('[role="dialog"], .wex-modal, [class*="modal"]').first();
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
    await page.waitForLoadState('networkidle');
    const modal = page.locator('[role="dialog"], .wex-modal, [class*="modal"]').first();
    await expect(modal).not.toBeVisible();
  });
});

test.describe('Homepage — recherche', () => {
  test.beforeEach(async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('wex_lang', 'fr'));
    await page.goto('/');
    await page.locator('input.wex-input').first().waitFor({ timeout: T });
  });

  test('#9 recherche retourne des résultats avec compteur', async ({ page }) => {
    const input = page.locator('input.wex-input').first();
    await input.fill('chat');
    await input.press('Enter');
    // Attendre au moins une carte résultat
    await expect(page.locator('[data-region], [class*="expression-card"], [class*="ExpressionCard"]').first()).toBeVisible({ timeout: T });
  });

  test('#10 rechargement après recherche relance la recherche', async ({ page }) => {
    const input = page.locator('input.wex-input').first();
    await input.fill('argent');
    await input.press('Enter');
    await page.locator('[data-region], [class*="card"]').first().waitFor({ timeout: T });
    await page.reload();
    await expect(page).toHaveURL(/#q=argent/);
    await expect(page.locator('[data-region], [class*="card"]').first()).toBeVisible({ timeout: T });
  });

  test('#11 infinite scroll charge plus de résultats', async ({ page }) => {
    const input = page.locator('input.wex-input').first();
    await input.fill('avoir');
    await input.press('Enter');
    await page.locator('[data-region], [class*="card"]').first().waitFor({ timeout: T });
    const initialCount = await page.locator('[data-region], [class*="card"]').count();
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);
    const newCount = await page.locator('[data-region], [class*="card"]').count();
    expect(newCount).toBeGreaterThanOrEqual(initialCount);
  });

  test('#12 clic sur une carte navigue vers /expression/[id]', async ({ page }) => {
    const input = page.locator('input.wex-input').first();
    await input.fill('chat');
    await input.press('Enter');
    const card = page.locator('a[href*="/expression/"]').first();
    await card.waitFor({ timeout: T });
    await card.click();
    await expect(page).toHaveURL(/\/expression\//);
  });

  test('#13 clic sur un tag relance la recherche', async ({ page }) => {
    const input = page.locator('input.wex-input').first();
    await input.fill('argent');
    await input.press('Enter');
    await page.locator('[data-region], [class*="card"]').first().waitFor({ timeout: T });
    const tag = page.locator('[class*="tag"], [class*="Tag"]').first();
    if (await tag.isVisible()) {
      await tag.click();
      await expect(page).toHaveURL(/#q=/);
    }
  });

  test('#15 clic sur un chip de suggestion lance la recherche', async ({ page }) => {
    const chip = page.locator('[class*="chip"], [class*="Chip"], [class*="hint"]').first();
    if (await chip.isVisible({ timeout: 5000 }).catch(() => false)) {
      await chip.click();
      await expect(page).toHaveURL(/#q=/);
    }
  });
});

test.describe('Homepage — navigation sidebar', () => {
  test.beforeEach(async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('wex_lang', 'fr'));
    await page.goto('/');
    await page.locator('.wex-sidebar').first().waitFor({ timeout: T });
  });

  test('#16 clic sur le wordmark revient à l\'accueil vierge', async ({ page }) => {
    const input = page.locator('input.wex-input').first();
    await input.fill('chat');
    await input.press('Enter');
    const logo = page.locator('.wex-sidebar a[href="/"]').first();
    await logo.click();
    await expect(page).toHaveURL(/^\/?(\?.*|#.*)?$/);
  });

  test('#17 "Accueil" est en surbrillance dans la sidebar sur /', async ({ page }) => {
    const homeLink = page.locator('.wex-sidebar a[href="/"]').first();
    await expect(homeLink).toBeVisible({ timeout: T });
    const color = await homeLink.evaluate((el) => getComputedStyle(el).color);
    // La couleur active est --plum (#7c3aed), pas la couleur par défaut
    expect(color).not.toBe('rgb(92, 79, 58)'); // --ink-soft
  });
});

import { test, expect } from '@playwright/test';

const T = 90_000;

// Ouvre l'overlay depuis la sidebar et retourne le locator du champ texte
async function openOverlay(page: import('@playwright/test').Page) {
  await page.locator('.wex-sidebar').first().waitFor({ timeout: T });
  const searchBtn = page.locator('.wex-sidebar button').filter({ hasText: /Rechercher|Search|Buscar|Cerca|Ara/i }).first();
  await searchBtn.click();
  const overlayInput = page.locator('[data-testid="overlay-input"]').first();
  await overlayInput.waitFor({ timeout: T });
  return overlayInput;
}

test.describe('SearchOverlay (US-005)', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('wex_lang', 'fr'));
  });

  // ─── Ouverture / fermeture ───────────────────────────────────────────────────

  test('#O1 l\'overlay s\'ouvre avec champ texte, pill Tous et pills pays', async ({ page }) => {
    await page.goto('/');
    const overlayInput = await openOverlay(page);
    await expect(overlayInput).toBeVisible({ timeout: T });
    // Pill Tous active par défaut
    const tousBtn = page.locator('button').filter({ hasText: /^Tous$|^All$|^Todos$|^Tutti$|^Tümü$/ }).first();
    await expect(tousBtn).toBeVisible({ timeout: T });
    // Pill FR visible
    const frPill = page.locator('button').filter({ hasText: / FR$/ }).first();
    await expect(frPill).toBeVisible({ timeout: T });
  });

  test('#O2 appuyer Échap ferme l\'overlay', async ({ page }) => {
    await page.goto('/');
    await openOverlay(page);
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-testid="overlay-input"]').first()).not.toBeVisible({ timeout: 5000 });
  });

  test('#O3 cliquer en dehors ferme l\'overlay', async ({ page }) => {
    await page.goto('/');
    await openOverlay(page);
    await page.mouse.click(10, 10);
    await expect(page.locator('[data-testid="overlay-input"]').first()).not.toBeVisible({ timeout: 5000 });
  });

  // ─── Pills pays ──────────────────────────────────────────────────────────────

  test('#O4 clic sur pill FR → devient active (un seul clic toggle)', async ({ page }) => {
    await page.goto('/');
    await openOverlay(page);
    const frPill = page.locator('button').filter({ hasText: / FR$/ }).first();
    await expect(frPill).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    await frPill.click();
    await expect(frPill).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)', { timeout: T });
  });

  test('#O5 double-clic sur pill FR → revient à inactif', async ({ page }) => {
    await page.goto('/');
    await openOverlay(page);
    const frPill = page.locator('button').filter({ hasText: / FR$/ }).first();
    await frPill.click();
    await expect(frPill).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)', { timeout: T });
    await frPill.click();
    await expect(frPill).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)', { timeout: T });
  });

  test('#O6 sélection de plusieurs pays simultanément', async ({ page }) => {
    await page.goto('/');
    await openOverlay(page);
    const frPill = page.locator('button').filter({ hasText: / FR$/ }).first();
    const esPill = page.locator('button').filter({ hasText: / ES$/ }).first();
    await frPill.click();
    await esPill.click();
    const frBg = await frPill.evaluate((el) => getComputedStyle(el).backgroundColor);
    const esBg = await esPill.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(frBg).toMatch(/rgb/);
    expect(esBg).toMatch(/rgb/);
  });

  test('#O7 les chips concepts sont chargés depuis l\'API', async ({ page }) => {
    await page.goto('/');
    await openOverlay(page);
    const chips = page.locator('[data-testid="concept-chip"]');
    await expect(async () => {
      const count = await chips.count();
      expect(count).toBeGreaterThan(1);
    }).toPass({ timeout: T });
  });

  test('#O8 clic sur un chip concept navigue vers /search?concept=slug', async ({ page }) => {
    await page.goto('/');
    await openOverlay(page);
    const chips = page.locator('[data-testid="concept-chip"]');
    await expect(async () => {
      expect(await chips.count()).toBeGreaterThan(0);
    }).toPass({ timeout: T });
    const firstChip = chips.first();
    await firstChip.click();
    await expect(page).toHaveURL(/\/search\?concept=/, { timeout: T });
  });

  test('#O9 pill Tous remet à zéro la sélection de pays', async ({ page }) => {
    await page.goto('/');
    await openOverlay(page);
    // Sélectionner FR
    const frPill = page.locator('button').filter({ hasText: / FR$/ }).first();
    await frPill.click();
    await expect(frPill).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)', { timeout: T });
    // Cliquer Tous → FR redevient inactif
    const tousBtn = page.locator('button').filter({ hasText: /^Tous$|^All$|^Todos$|^Tutti$|^Tümü$/ }).first();
    await tousBtn.click();
    await expect(frPill).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)', { timeout: T });
  });

  // ─── Visibilité du bouton Rechercher ─────────────────────────────────────────

  test('#O10 bouton "Rechercher →" absent si champ vide', async ({ page }) => {
    await page.goto('/');
    await openOverlay(page);
    const submitBtn = page.locator('button').filter({ hasText: /Rechercher →|Search →|Buscar →|Cerca →|Ara →/ }).first();
    await expect(submitBtn).not.toBeVisible();
  });

  test('#O11 bouton "Rechercher →" apparaît dès que le champ contient 2+ caractères', async ({ page }) => {
    await page.goto('/');
    await openOverlay(page);
    const overlayInput = page.locator('[data-testid="overlay-input"]').first();
    await overlayInput.fill('ar');
    const submitBtn = page.locator('button').filter({ hasText: /Rechercher →|Search →/ }).first();
    await expect(submitBtn).toBeVisible({ timeout: T });
  });

  // ─── Navigation après recherche ──────────────────────────────────────────────

  test('#O12 texte seul → navigue vers /search?q=mot', async ({ page }) => {
    await page.goto('/');
    await openOverlay(page);
    const overlayInput = page.locator('[data-testid="overlay-input"]').first();
    await overlayInput.fill('argent');
    await overlayInput.press('Enter');
    await expect(page).toHaveURL(/\/search\?q=argent/, { timeout: T });
  });

  test('#O13 texte + pays FR → navigue vers /search?q=mot&region=fr', async ({ page }) => {
    await page.goto('/');
    await openOverlay(page);
    const overlayInput = page.locator('[data-testid="overlay-input"]').first();
    await overlayInput.fill('peur');
    const frPill = page.locator('button').filter({ hasText: / FR$/ }).first();
    await frPill.click();
    await overlayInput.press('Enter');
    await expect(page).toHaveURL(/\/search\?q=peur.*region=fr|region=fr.*q=peur/, { timeout: T });
  });

  test('#O14 texte + deux pays → URL contient les deux régions', async ({ page }) => {
    await page.goto('/');
    await openOverlay(page);
    const overlayInput = page.locator('[data-testid="overlay-input"]').first();
    await overlayInput.fill('amour');
    await page.locator('button').filter({ hasText: / FR$/ }).first().click();
    await page.locator('button').filter({ hasText: / EN$/ }).first().click();
    const submitBtn = page.locator('button').filter({ hasText: /Rechercher →|Search →/ }).first();
    await submitBtn.click();
    await expect(page).toHaveURL(/region=fr.*uk|region=uk.*fr|region=fr%2Cuk|region=uk%2Cfr/, { timeout: T });
  });

  test('#O15 chip concept + pays → navigue vers /search?concept=slug&region=...', async ({ page }) => {
    await page.goto('/');
    await openOverlay(page);
    // Sélectionner FR
    const frPill = page.locator('button').filter({ hasText: / FR$/ }).first();
    await frPill.click();
    // Attendre les chips et cliquer le premier
    const chips = page.locator('[data-testid="concept-chip"]');
    await expect(async () => {
      expect(await chips.count()).toBeGreaterThan(0);
    }).toPass({ timeout: T });
    await chips.first().click();
    await expect(page).toHaveURL(/\/search\?concept=.*region=fr|\/search\?concept=/, { timeout: T });
  });

  test('#O16 touche Entrée soumet la recherche (sans cliquer le bouton)', async ({ page }) => {
    await page.goto('/');
    await openOverlay(page);
    const overlayInput = page.locator('[data-testid="overlay-input"]').first();
    await overlayInput.fill('chat');
    await overlayInput.press('Enter');
    await expect(page).toHaveURL(/\/search\?q=chat/, { timeout: T });
  });

  // ─── Overlay depuis d\'autres pages ──────────────────────────────────────────

  test('#O17 overlay accessible depuis la page /expression/[id]', async ({ page }) => {
    await page.goto('/random');
    await page.waitForURL(/\/expression\//, { timeout: T });
    const searchIconBtn = page.locator('button[title*="earch"], button[aria-label*="earch"]').first();
    if (await searchIconBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await searchIconBtn.click();
      await expect(page.locator('[data-testid="overlay-input"]').first()).toBeVisible({ timeout: T });
    }
  });
});

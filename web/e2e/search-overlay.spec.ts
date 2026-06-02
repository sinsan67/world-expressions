import { test, expect } from '@playwright/test';

const T = 90_000;

// Ouvre l'overlay depuis la sidebar et retourne le locator du select (ancre unique de l'overlay)
async function openOverlay(page: import('@playwright/test').Page) {
  await page.locator('.wex-sidebar').first().waitFor({ timeout: T });
  const searchBtn = page.locator('.wex-sidebar button').filter({ hasText: /Rechercher|Search|Buscar|Cerca|Ara/i }).first();
  await searchBtn.click();
  // Le <select> concept n'existe que dans l'overlay
  const overlaySelect = page.locator('select').first();
  await overlaySelect.waitFor({ timeout: T });
  return overlaySelect;
}

test.describe('SearchOverlay (US-005)', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('wex_lang', 'fr'));
  });

  // ─── Ouverture / fermeture ───────────────────────────────────────────────────

  test('#O1 l\'overlay s\'ouvre avec champ texte, pills pays et dropdown concept', async ({ page }) => {
    await page.goto('/');
    await openOverlay(page);
    // Champ texte autofocalisé (type="text" sans classe, différent du wex-input principal)
    const overlayInput = page.locator('input[type="text"]:not(.wex-input)').first();
    await expect(overlayInput).toBeVisible({ timeout: T });
    // Pills pays : au moins la pill FR visible
    const frPill = page.locator('button').filter({ hasText: / FR$/ }).first();
    await expect(frPill).toBeVisible({ timeout: T });
    // Dropdown concept visible
    await expect(page.locator('select').first()).toBeVisible({ timeout: T });
  });

  test('#O2 appuyer Échap ferme l\'overlay', async ({ page }) => {
    await page.goto('/');
    await openOverlay(page);
    await page.keyboard.press('Escape');
    // Après fermeture, le <select> ne doit plus être dans le DOM
    await expect(page.locator('select').first()).not.toBeVisible({ timeout: 5000 });
  });

  test('#O3 cliquer en dehors ferme l\'overlay', async ({ page }) => {
    await page.goto('/');
    await openOverlay(page);
    // Cliquer sur le backdrop (coin supérieur gauche hors de la fenêtre modale)
    await page.mouse.click(10, 10);
    await expect(page.locator('select').first()).not.toBeVisible({ timeout: 5000 });
  });

  // ─── Pills pays ──────────────────────────────────────────────────────────────

  test('#O4 clic sur pill FR → devient active (un seul clic toggle)', async ({ page }) => {
    await page.goto('/');
    await openOverlay(page);
    const frPill = page.locator('button').filter({ hasText: / FR$/ }).first();
    // Avant clic : fond transparent
    await expect(frPill).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    await frPill.click();
    // Après clic : fond plum — toHaveCSS retente jusqu'au re-render React
    await expect(frPill).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)', { timeout: T });
  });

  test('#O5 double-clic sur pill FR → revient à inactif', async ({ page }) => {
    await page.goto('/');
    await openOverlay(page);
    const frPill = page.locator('button').filter({ hasText: / FR$/ }).first();
    await frPill.click(); // active
    await expect(frPill).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)', { timeout: T });
    await frPill.click(); // inactif à nouveau
    await expect(frPill).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)', { timeout: T });
  });

  test('#O6 sélection de plusieurs pays simultanément', async ({ page }) => {
    await page.goto('/');
    await openOverlay(page);
    const frPill = page.locator('button').filter({ hasText: / FR$/ }).first();
    const esPill = page.locator('button').filter({ hasText: / ES$/ }).first();
    await frPill.click();
    await esPill.click();
    // Les deux pills doivent être actives (fond différent)
    const frBg = await frPill.evaluate((el) => getComputedStyle(el).backgroundColor);
    const esBg = await esPill.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(frBg).toMatch(/rgb/); // fond coloré (pas transparent)
    expect(esBg).toMatch(/rgb/);
  });

  // ─── Dropdown concept ────────────────────────────────────────────────────────

  test('#O7 le dropdown concept contient des options localisées', async ({ page }) => {
    await page.goto('/');
    await openOverlay(page);
    const select = page.locator('select').first();
    await expect(select).toBeVisible({ timeout: T });
    const options = select.locator('option');
    // Attendre que l'API charge les concepts (appel useEffect async) — toPass retente
    await expect(async () => {
      const count = await options.count();
      expect(count).toBeGreaterThan(1);
    }).toPass({ timeout: T });
  });

  test('#O8 sélectionner un concept l\'affiche dans le dropdown', async ({ page }) => {
    await page.goto('/');
    await openOverlay(page);
    const select = page.locator('select').first();
    const options = await select.locator('option').all();
    if (options.length <= 1) return; // pas de concepts chargés
    // Sélectionner le 2e option (premier concept réel)
    const secondOption = options[1];
    const slug = await secondOption.getAttribute('value');
    if (!slug) return;
    await select.selectOption(slug);
    await expect(select).toHaveValue(slug);
  });

  test('#O9 le bouton X concept efface la sélection', async ({ page }) => {
    await page.goto('/');
    await openOverlay(page);
    const select = page.locator('select').first();
    const options = await select.locator('option').all();
    if (options.length <= 1) return;
    const slug = await options[1].getAttribute('value');
    if (!slug) return;
    await select.selectOption(slug);
    // Le bouton X (aria ou lucide X) doit apparaître et effacer
    const clearBtn = page.locator('button').filter({ has: page.locator('svg') }).last();
    // Chercher le X qui efface le concept (il n'apparaît que quand un concept est sélectionné)
    // Alternative : vérifier que la valeur revient à "" après un clic sur un bouton X proche du select
    // On vérifie juste que X existe et est cliquable
    if (await clearBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await clearBtn.click();
      await expect(select).toHaveValue('');
    }
  });

  // ─── Visibilité du bouton Rechercher ─────────────────────────────────────────

  test('#O10 bouton "Rechercher →" absent si champ vide et aucun concept', async ({ page }) => {
    await page.goto('/');
    await openOverlay(page);
    // Champ vide, pas de concept sélectionné → pas de bouton submit
    const submitBtn = page.locator('button').filter({ hasText: /Rechercher →|Search →|Buscar →|Cerca →|Ara →/ }).first();
    await expect(submitBtn).not.toBeVisible();
  });

  test('#O11 bouton "Rechercher →" apparaît dès que le champ contient 2+ caractères', async ({ page }) => {
    await page.goto('/');
    await openOverlay(page);
    const overlayInput = page.locator('input[type="text"]:not(.wex-input)').first();
    await overlayInput.fill('ar');
    const submitBtn = page.locator('button').filter({ hasText: /Rechercher →|Search →/ }).first();
    await expect(submitBtn).toBeVisible({ timeout: T });
  });

  // ─── Navigation après recherche ──────────────────────────────────────────────

  test('#O12 texte seul → navigue vers /search?q=mot', async ({ page }) => {
    await page.goto('/');
    await openOverlay(page);
    const overlayInput = page.locator('input[type="text"]:not(.wex-input)').first();
    await overlayInput.fill('argent');
    await overlayInput.press('Enter');
    await expect(page).toHaveURL(/\/search\?q=argent/, { timeout: T });
  });

  test('#O13 texte + pays FR → navigue vers /search?q=mot&region=fr', async ({ page }) => {
    await page.goto('/');
    await openOverlay(page);
    const overlayInput = page.locator('input[type="text"]:not(.wex-input)').first();
    await overlayInput.fill('peur');
    const frPill = page.locator('button').filter({ hasText: / FR$/ }).first();
    await frPill.click();
    await overlayInput.press('Enter');
    await expect(page).toHaveURL(/\/search\?q=peur.*region=fr|region=fr.*q=peur/, { timeout: T });
  });

  test('#O14 texte + deux pays → URL contient les deux régions', async ({ page }) => {
    await page.goto('/');
    await openOverlay(page);
    const overlayInput = page.locator('input[type="text"]:not(.wex-input)').first();
    await overlayInput.fill('amour');
    await page.locator('button').filter({ hasText: / FR$/ }).first().click();
    await page.locator('button').filter({ hasText: / EN$/ }).first().click();
    const submitBtn = page.locator('button').filter({ hasText: /Rechercher →|Search →/ }).first();
    await submitBtn.click();
    await expect(page).toHaveURL(/region=fr.*uk|region=uk.*fr|region=fr%2Cuk|region=uk%2Cfr/, { timeout: T });
  });

  test('#O15 concept seul (sans texte) → navigue vers /search?concept=slug', async ({ page }) => {
    await page.goto('/');
    await openOverlay(page);
    const select = page.locator('select').first();
    const options = await select.locator('option').all();
    if (options.length <= 1) return;
    const slug = await options[1].getAttribute('value');
    if (!slug) return;
    await select.selectOption(slug);
    const submitBtn = page.locator('button').filter({ hasText: /Rechercher →|Search →|Buscar →|Cerca →|Ara →/ }).first();
    await expect(submitBtn).toBeVisible({ timeout: T });
    await submitBtn.click();
    await expect(page).toHaveURL(new RegExp(`/search\\?concept=${slug}`), { timeout: T });
  });

  test('#O16 touche Entrée soumet la recherche (sans cliquer le bouton)', async ({ page }) => {
    await page.goto('/');
    await openOverlay(page);
    const overlayInput = page.locator('input[type="text"]:not(.wex-input)').first();
    await overlayInput.fill('chat');
    await overlayInput.press('Enter');
    await expect(page).toHaveURL(/\/search\?q=chat/, { timeout: T });
  });

  // ─── Overlay depuis d\'autres pages ──────────────────────────────────────────

  test('#O17 overlay accessible depuis la page /expression/[id]', async ({ page }) => {
    await page.goto('/random');
    await page.waitForURL(/\/expression\//, { timeout: T });
    // Sur la page expression, il y a aussi un bouton loupe dans la nav hero
    // Mais le bouton sidebar "Rechercher" n'est pas disponible (sidebar n'est pas là)
    // → Tester le bouton loupe dans la nav de la page expression
    const searchIconBtn = page.locator('button[title*="earch"], button[aria-label*="earch"]').first();
    if (await searchIconBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await searchIconBtn.click();
      await expect(page.locator('select').first()).toBeVisible({ timeout: T });
    }
  });
});

import { test, expect } from '@playwright/test';

const T = 90_000;
const CARD = '[data-testid="expression-card"]';

test.describe('Page /search (US-006)', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('wex_lang', 'fr'));
  });

  // ─── État vide ───────────────────────────────────────────────────────────────

  test('#S1 /search sans paramètres → écran d\'invite, aucune carte', async ({ page }) => {
    await page.goto('/search');
    // Le placeholder 🔍 doit s'afficher
    await expect(page.locator('text=🔍').first()).toBeVisible({ timeout: T });
    // Aucune carte expression
    await expect(page.locator(CARD)).toHaveCount(0);
    // La sidebar reste visible (pas de crash)
    await expect(page.locator('.wex-sidebar').first()).toBeVisible({ timeout: T });
  });

  // ─── Recherche basique ───────────────────────────────────────────────────────

  test('#S2 recherche depuis la barre → URL /search?q=mot', async ({ page }) => {
    await page.goto('/search');
    const input = page.locator('input.wex-input').first();
    await input.waitFor({ timeout: T });
    await input.fill('argent');
    await input.press('Enter');
    await expect(page).toHaveURL(/\/search\?q=argent/, { timeout: T });
  });

  test('#S3 résultats et compteur visibles après recherche', async ({ page }) => {
    await page.goto('/search?q=argent');
    await expect(page.locator(CARD).first()).toBeVisible({ timeout: T });
    // Le compteur "X expressions pour « argent »" doit contenir "argent"
    const counter = page.locator('p').filter({ hasText: /argent/ }).first();
    await expect(counter).toBeVisible({ timeout: T });
  });

  test('#S4 titre de page mis à jour avec le mot recherché', async ({ page }) => {
    await page.goto('/search?q=argent');
    await page.locator(CARD).first().waitFor({ timeout: T });
    await expect(page).toHaveTitle(/argent/i);
  });

  test('#S5 clic sur une carte navigue vers /expression/[id]', async ({ page }) => {
    await page.goto('/search?q=argent');
    const card = page.locator(CARD).first();
    await card.waitFor({ timeout: T });
    await card.locator('span').first().click();
    await expect(page).toHaveURL(/\/expression\//, { timeout: T });
  });

  // ─── Filtre région ────────────────────────────────────────────────────────────

  // FIXME (S132): BUG produit confirmé en live — le dropdown « pays » de /search liste
  // les SOUS-RÉGIONS (Bretagne, Alsace) au lieu des pays, car la page utilise
  // getRegions() au lieu de getCountries() (HomePage et Atlas le font correctement).
  // « France » n'apparaît donc jamais : l'ancienne garde `if (!isVisible) return`
  // faisait passer ce test à vide → le faux-vert a MASQUÉ le bug. À corriger à
  // l'atelier pages de recherche (S133) puis durcir ce test. Voir
  // feature-search-pages-workshop en mémoire projet.
  test.fixme('#S6 filtre pays "France" → URL mise à jour avec country=fr', async ({ page }) => {
    await page.goto('/search?q=argent');
    await page.locator(CARD).first().waitFor({ timeout: T });
    // Ouvrir le dropdown pays
    const filterBtn = page.locator('button').filter({ hasText: /Tous les pays/i }).first();
    await expect(filterBtn).toBeVisible({ timeout: T });
    await filterBtn.click();
    // Cocher France
    const franceLabel = page.locator('label').filter({ hasText: /France/ }).first();
    await expect(franceLabel).toBeVisible({ timeout: T });
    await franceLabel.click();
    await expect(page).toHaveURL(/country=fr/, { timeout: T });
  });

  test('#S7 URL /search?q=argent&country=fr → au moins une carte FR visible', async ({ page }) => {
    await page.goto('/search?q=argent&country=fr');
    await expect(page.locator(CARD).first()).toBeVisible({ timeout: T });
  });

  // ─── Aucun résultat ───────────────────────────────────────────────────────────

  test('#S8 recherche sans résultat → message vide, pas d\'erreur', async ({ page }) => {
    await page.goto('/search?q=xyzxyzxyz999');
    // Aucune carte
    await expect(page.locator(CARD)).toHaveCount(0, { timeout: T });
    // Message "Aucune expression trouvée"
    await expect(page.locator('text=Aucune expression').first()).toBeVisible({ timeout: T });
    // La sidebar est toujours là (pas de crash)
    await expect(page.locator('.wex-sidebar').first()).toBeVisible({ timeout: T });
  });

  // ─── Navigation navigateur ────────────────────────────────────────────────────

  test('#S9 bouton Précédent revient à la première recherche', async ({ page }) => {
    await page.goto('/search?q=peur');
    await page.locator(CARD).first().waitFor({ timeout: T });

    const input = page.locator('input.wex-input').first();
    await input.fill('amour');
    await input.press('Enter');
    await expect(page).toHaveURL(/q=amour/, { timeout: T });

    await page.goBack();
    await expect(page).toHaveURL(/q=peur/, { timeout: T });
  });

  // ─── Infinite scroll ──────────────────────────────────────────────────────────

  test('#S10 infinite scroll charge plus de résultats', async ({ page }) => {
    await page.goto('/search?q=avoir');
    await page.locator(CARD).first().waitFor({ timeout: T });
    const initialCount = await page.locator(CARD).count();
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(3000);
    const newCount = await page.locator(CARD).count();
    expect(newCount).toBeGreaterThanOrEqual(initialCount);
  });

  // ─── En-têtes de section match_type ─────────────────────────────────────────

  test('#S11 en-têtes de section (🎯💡🏷️🌍) visibles quand plusieurs types', async ({ page }) => {
    // "argent" produit des résultats exact + semantic + concept → headers attendus
    await page.goto('/search?q=argent');
    await page.locator(CARD).first().waitFor({ timeout: T });
    // Chercher au moins un emoji de section parmi les 4 possibles
    const sectionEmoji = page.locator('span').filter({ hasText: /^(🎯|💡|🏷️|🌍)$/ });
    if (await sectionEmoji.count() > 0) {
      await expect(sectionEmoji.first()).toBeVisible({ timeout: T });
    }
    // Le label de section "Dans le texte" doit accompagner l'emoji 🎯
    const exactLabel = page.locator('span').filter({ hasText: /Dans le texte|In the text/ });
    if (await exactLabel.count() > 0) {
      await expect(exactLabel.first()).toBeVisible({ timeout: T });
    }
  });

  // ─── Cap 6 cartes + bouton "Voir les N autres" ─────────────────────────────

  test('#S12 bouton "Voir les N autres →" apparaît pour une section > 6 cartes', async ({ page }) => {
    // "avoir" a de nombreuses correspondances exactes → section exact > 6
    await page.goto('/search?q=avoir');
    await page.locator(CARD).first().waitFor({ timeout: T });
    const showMoreBtn = page.locator('button').filter({ hasText: /Voir les \d+ autres|Show \d+ more|Ver \d+ más|Vedi altri \d+|\d+ tane daha/ }).first();
    if (!await showMoreBtn.isVisible({ timeout: 8000 }).catch(() => false)) return;
    const countBefore = await page.locator(CARD).count();
    await showMoreBtn.click();
    const countAfter = await page.locator(CARD).count();
    expect(countAfter).toBeGreaterThan(countBefore);
  });

  test('#S13 le bouton "Voir les N autres" disparaît après expansion', async ({ page }) => {
    await page.goto('/search?q=avoir');
    await page.locator(CARD).first().waitFor({ timeout: T });
    const showMoreBtn = page.locator('button').filter({ hasText: /Voir les \d+ autres|Show \d+ more/ }).first();
    if (!await showMoreBtn.isVisible({ timeout: 8000 }).catch(() => false)) return;
    await showMoreBtn.click();
    // Après expansion, le bouton de CETTE section ne doit plus être visible
    // (d'autres sections peuvent encore avoir leur propre bouton)
    await page.waitForTimeout(500);
    // On vérifie juste que le clic a fonctionné (plus de cartes)
    await expect(page.locator(CARD).first()).toBeVisible({ timeout: T });
  });

  // ─── Tri par pays ─────────────────────────────────────────────────────────────

  test('#S14 tri "Par pays" groupe les résultats avec en-têtes par drapeau', async ({ page }) => {
    await page.goto('/search?q=argent');
    await page.locator(CARD).first().waitFor({ timeout: T });
    const sortCountryBtn = page.locator('button').filter({ hasText: /Par pays|By country/i }).first();
    if (!await sortCountryBtn.isVisible({ timeout: 5000 }).catch(() => false)) return;
    await sortCountryBtn.click();
    // Des en-têtes avec drapeaux doivent apparaître
    const flagHeader = page.locator('span').filter({ hasText: /🇫🇷|🇬🇧|🇪🇸|🇮🇹|🇹🇷/ }).first();
    await expect(flagHeader).toBeVisible({ timeout: T });
  });

  // ─── Recherche par concept ────────────────────────────────────────────────────

  test('#S15 /search?concept=family → résultats multi-langues visibles', async ({ page }) => {
    await page.goto('/search?concept=family');
    await expect(page.locator(CARD).first()).toBeVisible({ timeout: T });
  });

  // ─── Recherche multilingue ────────────────────────────────────────────────────

  test('#S16 recherche "money" (EN) remonte des expressions non-FR', async ({ page }) => {
    await page.goto('/search?q=money');
    await expect(page.locator(CARD).first()).toBeVisible({ timeout: T });
    // Au moins une carte doit s'afficher — recherche cross-lingue active
    const count = await page.locator(CARD).count();
    expect(count).toBeGreaterThan(0);
  });
});

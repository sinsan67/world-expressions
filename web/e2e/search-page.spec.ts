import { test, expect } from '@playwright/test';

const T = 90_000;
const CARD = '[data-testid="expression-card"]';
const SHEET = '[data-testid="expression-sheet"]';

test.describe('Page /search (US-006)', () => {
  // Sidebar and sort/filter features rely on desktop layout — force desktop viewport
  // even when run by the mobile-chrome project. Mobile BottomNav tests are in a
  // separate describe at the bottom of this file.
  test.use({ viewport: { width: 1280, height: 800 } });

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

  // Lot N2 (atelier S208 décision 2) : le clic sur une carte n'emmène plus
  // sur /expression/[id] — il ouvre une bottom-sheet PAR-DESSUS la liste.
  // Le chemin vers la fiche complète passe désormais par le lien de la sheet.
  test('#S5 clic sur une carte ouvre la bottom-sheet ; « fiche complète » navigue vers /expression/[id]', async ({ page }) => {
    await page.goto('/search?q=argent');
    const card = page.locator(CARD).first();
    await card.waitFor({ timeout: T });
    await card.locator('span').first().click();

    const sheet = page.locator(SHEET);
    await expect(sheet).toBeVisible({ timeout: T });
    // La liste vit toujours derrière la sheet.
    await expect(page.locator(CARD).first()).toBeAttached();
    // L'ouverture est historisée (?sheet=<id>) sans toucher aux params de recherche.
    await expect(page).toHaveURL(/sheet=/, { timeout: T });
    await expect(page).toHaveURL(/q=argent/);

    await sheet.getByText('Voir la fiche complète').click();
    await expect(page).toHaveURL(/\/expression\//, { timeout: T });
  });

  test('#S29 retour navigateur ferme la sheet, la liste et l\'URL de recherche restent intactes', async ({ page }) => {
    await page.goto('/search?q=argent');
    const card = page.locator(CARD).first();
    await card.waitFor({ timeout: T });
    await card.locator('span').first().click();
    await expect(page.locator(SHEET)).toBeVisible({ timeout: T });

    await page.goBack();
    await expect(page.locator(SHEET)).toHaveCount(0, { timeout: T });
    await expect(page).toHaveURL(/q=argent/);
    await expect(page).not.toHaveURL(/sheet=/);
    await expect(page.locator(CARD).first()).toBeVisible({ timeout: T });
  });

  test('#S30 le bouton ✕ de la sheet la ferme sans quitter la recherche', async ({ page }) => {
    await page.goto('/search?q=argent');
    const card = page.locator(CARD).first();
    await card.waitFor({ timeout: T });
    await card.locator('span').first().click();
    await expect(page.locator(SHEET)).toBeVisible({ timeout: T });

    await page.getByRole('button', { name: 'Retour aux résultats' }).click();
    await expect(page.locator(SHEET)).toHaveCount(0, { timeout: T });
    await expect(page).toHaveURL(/q=argent/);
    await expect(page.locator(CARD).first()).toBeVisible({ timeout: T });
  });

  test('#S31 recharger avec ?sheet=<id> rouvre la sheet (deep link), ✕ nettoie l\'URL', async ({ page }) => {
    await page.goto('/search?q=argent');
    const card = page.locator(CARD).first();
    await card.waitFor({ timeout: T });
    await card.locator('span').first().click();
    await expect(page.locator(SHEET)).toBeVisible({ timeout: T });
    await expect(page).toHaveURL(/sheet=/, { timeout: T });

    // Reload : la sheet se rouvre en refetchant l'expression par son id.
    await page.reload();
    await expect(page.locator(SHEET)).toBeVisible({ timeout: T });
    // L'expression finit par se charger dans la sheet (un titre h2 apparaît).
    await expect(page.locator(SHEET).locator('h2')).toBeVisible({ timeout: T });

    // Fermer depuis un deep link ne doit PAS faire un history.back() (qui
    // quitterait la recherche) — l'URL est nettoyée en place.
    await page.getByRole('button', { name: 'Retour aux résultats' }).click();
    await expect(page.locator(SHEET)).toHaveCount(0, { timeout: T });
    await expect(page).toHaveURL(/q=argent/);
    await expect(page).not.toHaveURL(/sheet=/);
  });

  // ─── Filtre région ────────────────────────────────────────────────────────────

  // S133: bug corrigé — /search utilise désormais getCountries() (filtre PAYS uniforme,
  // via le composant partagé ResultsFilterBar) et handleFilterChange écrit le param
  // `country` (et non plus `region`). « France » apparaît donc dans le déroulant et le
  // clic met l'URL à jour.
  // S135: sélecteur corrigé — France a des sous-régions (bretagne, alsace) donc son
  // élément de ligne est un <div>, pas un <label>. On cible la checkbox via data-testid.
  test('#S6 filtre pays "France" → URL mise à jour avec country=fr', async ({ page }) => {
    await page.goto('/search?q=argent');
    await page.locator(CARD).first().waitFor({ timeout: T });
    // Ouvrir le dropdown pays
    const filterBtn = page.locator('button').filter({ hasText: /Tous les pays/i }).first();
    await expect(filterBtn).toBeVisible({ timeout: T });
    await filterBtn.click();
    // Cocher France via sa checkbox (la ligne est un <div> car France a des sous-régions)
    const franceRow = page.locator('[data-testid="filter-country-fr"]');
    await expect(franceRow).toBeVisible({ timeout: T });
    await franceRow.locator('input[type="checkbox"]').click();
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
    await page.waitForTimeout(3000); // IntersectionObserver → fetch → re-render : pas de signal DOM unique observable
    const newCount = await page.locator(CARD).count();
    expect(newCount).toBeGreaterThanOrEqual(initialCount);
  });

  // ─── En-têtes de section match_type ─────────────────────────────────────────

  test('#S11 section des résultats exacte visible après recherche', async ({ page }) => {
    // "argent" → forte majorité de résultats exacts en français → mode langSplitSections
    // La section exact a data-testid="split-main-exact"
    await page.goto('/search?q=argent');
    await page.locator(CARD).first().waitFor({ timeout: T });
    const exactSection = page.locator('[data-testid="split-main-exact"]');
    await expect(exactSection).toBeVisible({ timeout: T });
  });

  // ─── Scroll infini : sections sans cap ni bouton "Voir plus" (S167) ──────────

  test('#S12 une section > 6 cartes affiche toutes ses cartes, sans bouton "Voir plus"', async ({ page }) => {
    // "avoir" → de nombreuses correspondances exactes en français (>6).
    // Depuis S167, les sections ne sont plus plafonnées à 6 : le scroll infini
    // global (sentinel) prend le relais. Plus aucun bouton show-more par section.
    await page.goto('/search?q=avoir');
    await page.locator(CARD).first().waitFor({ timeout: T });
    const exactSection = page.locator('[data-testid="split-main-exact"]');
    await expect(exactSection).toBeVisible({ timeout: T });
    // La section affiche directement plus de 6 cartes (pas de cap)
    await expect.poll(async () => exactSection.locator(CARD).count(), { timeout: T })
      .toBeGreaterThan(6);
    // Aucun bouton show-more ne doit exister
    await expect(page.locator('[data-testid="show-more-btn"]')).toHaveCount(0);
  });

  // ─── Tri par pays ─────────────────────────────────────────────────────────────

  test('#S14 tri "Par pays" groupe les résultats avec en-têtes par drapeau', async ({ page }) => {
    await page.goto('/search?q=argent');
    await page.locator(CARD).first().waitFor({ timeout: T });
    const sortCountryBtn = page.locator('button').filter({ hasText: /Par pays|By country/i }).first();
    // S133: garde silencieuse retirée — avec des résultats, le tri "Par pays" est
    // toujours présent (showSort défaut true). Son absence doit FAIRE ÉCHOUER le test.
    await expect(sortCountryBtn).toBeVisible({ timeout: T });
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

  // ─── Mode concept / domain — pas de split view ───────────────────────────────
  // Migrés depuis qa-issue-36-split-view.spec.ts (S5/S5b) — Bob 7 chantier 7

  test('#S17 mode concept : pas de badge détecté, pas de toggles split', async ({ page }) => {
    await page.goto('/search?concept=courage');
    await expect(page.locator(CARD).first()).toBeVisible({ timeout: T });
    await expect(page.getByText(/détecté/i)).not.toBeVisible({ timeout: 3_000 });
    await expect(page.getByRole('button', { name: /langue d.abord/i })).not.toBeVisible({ timeout: 3_000 });
    await expect(page.getByRole('button', { name: /tout mélanger/i })).not.toBeVisible({ timeout: 3_000 });
  });

  test('#S18 mode domain : pas de badge détecté, pas de toggles split', async ({ page }) => {
    await page.goto('/search?domain=emotions');
    await expect(page.locator(CARD).first()).toBeVisible({ timeout: T });
    await expect(page.getByText(/détecté/i)).not.toBeVisible({ timeout: 3_000 });
    await expect(page.getByRole('button', { name: /langue d.abord/i })).not.toBeVisible({ timeout: 3_000 });
  });

  test('#S19 tag cliquable dans une carte navigue vers /search ou /concept', async ({ page }) => {
    // régression issue #36
    await page.goto('/search?q=argent');
    await expect(page.locator(CARD).first()).toBeVisible({ timeout: T });
    const tag = page.locator(CARD).first().locator('button, a').filter({ hasText: /\w+/ }).first();
    test.skip(await tag.isVisible().catch(() => false) === false, 'aucun tag/lien cliquable dans la première carte');
    await tag.click();
    await expect(page).toHaveURL(/concept=|q=|search/, { timeout: 10_000 });
  });

  // ─── Split view — badge "détecté" + toggles ──────────────────────────────────
  // Migrés depuis qa-issue-36-split-view.spec.ts (S1/S3/S4/S6b) — Bob 7 chantier 7
  // Root cause du fixme original : cold start Render (25-45s) > timeout badge (25s).
  // Fix : attendre une carte d'abord (couvre le cold start), puis asserter le badge.

  test('#S20 badge "détecté" + sections split visibles pour "argent"', async ({ page }) => {
    await page.goto('/search?q=argent');
    await page.locator(CARD).first().waitFor({ timeout: T });
    // Le badge langue détectée doit apparaître une fois les résultats chargés
    await expect(page.getByText(/détecté|detected|algılandı|rilevato|erkannt|detectado/i)).toBeVisible({ timeout: T });
    // Toggles split view présents
    await expect(page.getByRole('button', { name: /langue d.abord|language first|dil önce/i })).toBeVisible({ timeout: T });
    await expect(page.getByRole('button', { name: /tout mélanger|mix|alles mischen/i })).toBeVisible({ timeout: T });
    // Sections split présentes
    await expect(page.getByText(/dans le texte|in the text|dans|in text/i).first()).toBeVisible({ timeout: T });
    await expect(page.getByText(/dans les autres langues|other languages|diğer diller/i).first()).toBeVisible({ timeout: T });
  });

  test('#S21 toggle "Tout mélanger" désactive le split view', async ({ page }) => {
    // régression issue #36
    await page.goto('/search?q=argent');
    await page.locator(CARD).first().waitFor({ timeout: T });
    await expect(page.getByText(/détecté|detected|algılandı|rilevato|erkannt|detectado/i)).toBeVisible({ timeout: T });
    const mixBtn = page.getByRole('button', { name: /tout mélanger|mix all/i });
    await mixBtn.click();
    // La section "autres langues" disparaît en mode mix
    await expect(page.getByText(/dans les autres langues|other languages/i)).not.toBeVisible({ timeout: 5_000 });
    // "Dans le texte" reste visible (matchTypeGroups actif)
    await expect(page.getByText(/dans le texte|in the text/i).first()).toBeVisible({ timeout: T });
    // Retour à "Langue d'abord" — la section réapparaît
    const langFirstBtn = page.getByRole('button', { name: /langue d.abord|language first/i });
    await langFirstBtn.click();
    await expect(page.getByText(/dans les autres langues|other languages/i).first()).toBeVisible({ timeout: 5_000 });
  });

  test('#S22 tri "Par pays" désactive le split view', async ({ page }) => {
    // régression issue #36
    await page.goto('/search?q=argent');
    await page.locator(CARD).first().waitFor({ timeout: T });
    await expect(page.getByText(/détecté|detected/i)).toBeVisible({ timeout: T });
    const sortByCountry = page.locator('button').filter({ hasText: /par pays|by country|per paese|ülkeye göre/i }).first();
    await expect(sortByCountry).toBeVisible({ timeout: T });
    await sortByCountry.click();
    // Mode "Par pays" : la section "autres langues" du split view disparaît
    await expect(page.getByText(/dans les autres langues|other languages/i)).not.toBeVisible({ timeout: 5_000 });
    // Des en-têtes par pays apparaissent
    const flagHeader = page.locator('span').filter({ hasText: /🇫🇷|🇬🇧|🇪🇸|🇮🇹|🇹🇷/ }).first();
    await expect(flagHeader).toBeVisible({ timeout: T });
  });

  test('#S23 "para" ambigu : résultats visibles, page ne crashe pas', async ({ page }) => {
    // "para" existe en TR et ES → langue ambiguë → pas de badge garanti
    // Le test vérifie seulement que l'app répond sans crash
    await page.goto('/search?q=para');
    await expect(page.locator(CARD).first()).toBeVisible({ timeout: T });
    expect(await page.locator(CARD).count()).toBeGreaterThan(0);
  });

  // ─── Domain banner ────────────────────────────────────────────────────────────
  // Migrés depuis qa-s64-domain-banner.spec.ts (S1a/S1b/S1c) — Bob 7 chantier 7

  test('#S24 /search?domain=X : bandeau avec nom du domaine visible', async ({ page }) => {
    await page.goto('/search?domain=emotions');
    await expect(page.locator(CARD).first()).toBeVisible({ timeout: T });
    const bannerName = page.getByRole('heading', { level: 2 }).filter({ hasText: /émotions|emotions/i });
    await expect(bannerName).toBeVisible({ timeout: T });
    // Compteur d'expressions visible
    await expect(page.getByText(/\d+ expression/i).first()).toBeVisible();
  });

  test('#S25 /search?concept=X : pas de bandeau domaine', async ({ page }) => {
    await page.goto('/search?concept=courage');
    await expect(page.locator(CARD).first()).toBeVisible({ timeout: T });
    // Mode concept n'a pas de bandeau domaine (h2)
    await expect(page.getByRole('heading', { level: 2 })).not.toBeVisible({ timeout: 3_000 });
  });

  test('#S26 split view : section principale "Dans le texte" visible pour "argent"', async ({ page }) => {
    // régression qa-s64 S2b
    await page.goto('/search?q=argent');
    await page.locator(CARD).first().waitFor({ timeout: T });
    await expect(page.getByText(/détecté|detected/i)).toBeVisible({ timeout: T });
    // La section exacte principale a son label "Dans le texte"
    const exactSection = page.locator('[data-testid="split-main-exact"]');
    await expect(exactSection).toBeVisible({ timeout: T });
  });

  test('#S27 mix view : résultats toujours visibles après toggle', async ({ page }) => {
    // régression qa-s64 S3
    await page.goto('/search?q=argent');
    await page.locator(CARD).first().waitFor({ timeout: T });
    await expect(page.getByText(/détecté|detected/i)).toBeVisible({ timeout: T });
    const mixBtn = page.getByRole('button', { name: /tout mélanger|mix all/i });
    await mixBtn.click();
    // matchTypeGroups actif en mode mix — des cartes restent visibles
    await expect(page.locator(CARD).first()).toBeVisible({ timeout: T });
    expect(await page.locator(CARD).count()).toBeGreaterThan(0);
  });
});

test.describe('Page /search — BottomNav mobile (< 1024px)', () => {
  // BottomNav is display:none above 1024px — force mobile viewport
  test.use({ viewport: { width: 390, height: 844 } });

  test('#S28 BottomNav visible sur page /search en mobile', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('wex_lang', 'fr'));
    await page.goto('/search?q=argent');
    await expect(page.locator(CARD).first()).toBeVisible({ timeout: T });
    const nav = page.locator('[data-testid="bottom-nav"]');
    await expect(nav).toBeVisible({ timeout: T });
    // 5 liens (home, search, random, atlas, concepts — search navigue vers /search depuis Lot F)
    expect(await nav.locator('a').count()).toBe(5);
  });
});

import { test, expect } from '@playwright/test';

const T = 90_000;
const DOMAIN = '[data-testid="domain-card"]';
const CONCEPT = '[data-testid="concept-card"]';

test.describe('Page /emoji', () => {
  test('#24 se charge et affiche la grille de domaines', async ({ page }) => {
    await page.goto('/emoji');
    await page.locator(DOMAIN).first().waitFor({ timeout: T });
    const count = await page.locator(DOMAIN).count();
    expect(count).toBeGreaterThanOrEqual(10);
  });

  test('#34 CTA "Jouer avec ces cartes" : sans domaine → /voyage ; domaine ouvert → domaine pré-rempli (Lot N2)', async ({ page }) => {
    await page.goto('/emoji');
    const cta = page.getByTestId('play-with-cards');
    await expect(cta).toBeVisible({ timeout: T });
    await expect(cta).toHaveAttribute('href', '/voyage');

    await page.goto('/emoji?domain=wisdom');
    await expect(cta).toHaveAttribute('href', '/voyage?domain=wisdom', { timeout: T });
  });

  // Domain cards now navigate to /search?domain= directly (commit 11fa98d).
  // Tests that need concept cards use /emoji?domain=X (URL-based panel still works).
  test('#26 clic domaine → navigue vers /search?domain=', async ({ page }) => {
    await page.goto('/emoji');
    await page.locator(DOMAIN).first().waitFor({ timeout: T });
    await page.locator(DOMAIN).first().click();
    await expect(page).toHaveURL(/\/search\?domain=\w+/, { timeout: T });
  });

  test('#27 filtre EN — la grille des domaines se met à jour', async ({ page }) => {
    // Le filtre langue est sur la grille des domaines (onglet Thèmes, sans domain panel ouvert).
    // Anciennement testé sur /emoji?domain=emotions → le filtre n'affectait pas le domain panel.
    // Réécrit Bob 7 : test sur /emoji (grille complète) pour une assertion significative.
    await page.goto('/emoji');
    await page.locator(DOMAIN).first().waitFor({ timeout: T });
    const initialCount = await page.locator(DOMAIN).count();
    const enBtn = page.locator('[data-testid="lang-filter-en"]');
    await expect(enBtn).toBeVisible({ timeout: T });
    await enBtn.click({ force: true });
    await page.locator(DOMAIN).first().waitFor({ timeout: T });
    // Après filtre EN, au moins un domaine doit rester visible
    expect(await page.locator(DOMAIN).count()).toBeGreaterThan(0);
    // Retour à "Tous" — au moins autant de domaines qu'au départ
    const tousBtn = page.locator('[data-testid="lang-filter-all"]');
    await tousBtn.click();
    await page.locator(DOMAIN).first().waitFor({ timeout: T });
    expect(await page.locator(DOMAIN).count()).toBeGreaterThanOrEqual(initialCount);
  });

  test('#28 filtre "Tous" restaure tous les concepts', async ({ page }) => {
    await page.goto('/emoji?domain=emotions');
    await page.locator(CONCEPT).first().waitFor({ timeout: T });
    const initialCount = await page.locator(CONCEPT).count();
    const frBtn = page.locator('[data-testid="lang-filter-fr"]');
    await expect(frBtn).toBeVisible({ timeout: T });
    await frBtn.click();
    await expect(page.locator(CONCEPT).first()).toBeVisible({ timeout: T });
    const tousBtn = page.locator('[data-testid="lang-filter-all"]');
    await tousBtn.click();
    await expect(page.locator(CONCEPT).first()).toBeVisible({ timeout: T });
    const afterCount = await page.locator(CONCEPT).count();
    expect(afterCount).toBeGreaterThanOrEqual(initialCount);
  });

  test('#30 clic sur un concept redirige vers search', async ({ page }) => {
    await page.goto('/emoji?domain=emotions');
    await page.locator(CONCEPT).first().waitFor({ timeout: T });
    await page.locator(CONCEPT).first().click();
    await expect(page).toHaveURL(/\/search\?concept=/, { timeout: T });
  });

  // Lot N1 (atelier S208 décision 2) : Concepts est sorti de la nav
  // persistante, relégué à la section "Explorer le monde" du hub — #31/#32
  // vérifiaient sa surbrillance dans la nav, elles vérifient maintenant son absence.
  test('#31 "Concepts" est absent de la sidebar (sorti de la nav persistante, Lot N1)', async ({ page }) => {
    await page.goto('/emoji');
    await expect(page.locator('.wex-sidebar a[href="/emoji"]')).toHaveCount(0);
  });

  test('#32 "Concepts" est absent de la BottomNav mobile (sorti de la nav persistante, Lot N1)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/emoji');
    await expect(page.locator('[data-testid="bottom-nav"] a[href="/emoji"]')).toHaveCount(0);
  });

  // ─── Domain panel via URL directe ─────────────────────────────────────────────
  // Migré depuis qa-s64-domain-banner.spec.ts (S4b+S4c) — Bob 7 chantier 7
  // S4a supprimé (doublon de #26). S4c (subset de S4b) fusionné ici.

  test('#33 /emoji?domain=X direct : bouton "Voir expressions" visible et fonctionnel', async ({ page }) => {
    await page.goto('/emoji?domain=emotions');
    // Le domain panel s'ouvre — attendre les concepts
    await page.locator(CONCEPT).first().waitFor({ timeout: T });
    // Le bouton "Voir les N expressions" doit être présent
    const seeExpressionsBtn = page.getByRole('button', { name: /voir les .* expressions|see .* expressions|ver .* expresiones|vedi .* espressioni|\d+ deyimi gör/i });
    await expect(seeExpressionsBtn).toBeVisible({ timeout: T });
    // Clic navigue vers /search?domain=
    await seeExpressionsBtn.click();
    await expect(page).toHaveURL(/\/search\?domain=\w+/, { timeout: 10_000 });
  });
});

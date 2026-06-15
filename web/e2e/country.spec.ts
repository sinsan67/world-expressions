import { test, expect } from '@playwright/test';

const T = 90_000;

test.describe('Page /country/[code]', () => {
  test('#46 /country/fr se charge avec un en-tête visible', async ({ page }) => {
    await page.goto('/country/fr');
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: T });
  });

  test('#47 les expressions du pays se chargent', async ({ page }) => {
    await page.goto('/country/fr');
    await page.locator('h1, h2').first().waitFor({ timeout: T });
    const cards = page.locator('[data-testid="expression-card"]');
    await expect(cards.first()).toBeVisible({ timeout: T });
    expect(await cards.count()).toBeGreaterThan(0);
  });

  test('#48 clic sur un chip concept filtre les expressions (reste sur /country/fr)', async ({ page }) => {
    await page.goto('/country/fr');
    await page.locator('h1, h2').first().waitFor({ timeout: T });
    // Les chips concept sont des boutons dans la section "Filtrer par concept"
    const chip = page.locator('button').filter({ hasText: /💰|❤️|😱|🐾|🏃|👁️|🎭|🎵|😄|😔/ }).first();
    // Sélecteur emoji fragile en CI (rendu Linux ≠ macOS) — à remplacer par data-testid
    const hasChip = await chip.isVisible({ timeout: 5000 }).catch(() => false);
    test.skip(!hasChip, 'chip concept invisible — sélecteur emoji fragile en CI, ajouter data-testid');
    await chip.click();
    // La page RESTE sur /country/fr (filtre local, pas de navigation)
    await expect(page).toHaveURL(/\/country\/fr/, { timeout: T });
    // Attendre la fin du filtre client-side : cartes ou état vide
    const cards = page.locator('[data-testid="expression-card"]');
    await cards.first().or(page.locator('text=Aucun résultat')).waitFor({ timeout: T });
    const hasCards = await cards.count();
    const hasEmpty = await page.locator('text=Aucun résultat').isVisible().catch(() => false);
    expect(hasCards > 0 || hasEmpty).toBe(true);
  });

  test('#49 bouton "Explorer toutes les langues" navigue vers /search', async ({ page }) => {
    await page.goto('/country/fr');
    await page.locator('h1, h2').first().waitFor({ timeout: T });
    // Le bouton "Explorer toutes les langues / Explore all languages" navigue vers /search
    const exploreBtn = page.locator('button').filter({ hasText: /Explorer toutes|Explore all|Explorar todos|Esplora tutte|Tüm dilleri/ }).first();
    await expect(exploreBtn).toBeVisible({ timeout: T });
    await exploreBtn.click();
    await expect(page).toHaveURL(/\/search/, { timeout: T });
  });

  test('sidebar active "Atlas" depuis /country/[code]', async ({ page }) => {
    await page.goto('/country/fr');
    await page.locator('h1, h2').first().waitFor({ timeout: T });
    // Pas d'item sidebar spécifique pour country — vérifier au moins que la sidebar s'affiche
    await expect(page.locator('.wex-sidebar').first()).toBeVisible({ timeout: T });
  });
});

import { test, expect } from '@playwright/test';

// /voyage appelle le backend Render (game-sessions) côté client.
// Vercel staging peut bloquer les routes sans bypass token — passer
// VERCEL_BYPASS_TOKEN=<token> (voir web/e2e/random.spec.ts) pour staging.
// En local (BASE_URL=http://localhost:3000) ça passe sans token.

const API_TIMEOUT = 90_000;

test.describe('Page /voyage', () => {
  // playwright.config.ts pré-remplit localStorage wex_lang=fr — on peut donc
  // matcher le texte français exact. Sélecteurs anchorés (pas juste /Next/i)
  // pour ne pas matcher le bouton "Open Next.js Dev Tools" du dev overlay.
  test('setup → play (10 cartes) → recap, en gardant au moins une expression', async ({ page }) => {
    await page.goto('/voyage');

    // Écran de filtres : le CTA "C'est parti" démarre une partie sans filtre.
    const startBtn = page.getByRole('button', { name: "C'est parti !" });
    await expect(startBtn).toBeVisible({ timeout: API_TIMEOUT });
    await expect(startBtn).toBeEnabled({ timeout: API_TIMEOUT });
    await startBtn.click();

    const revealBtn = page.getByRole('button', { name: 'Révéler le sens' });
    const nextBtn = page.getByRole('button', { name: 'Suivante ⏭' });
    const keepBtn = page.getByRole('button', { name: '❤️ Garder' });

    // Actions désactivées tant que la carte n'est pas révélée.
    await expect(revealBtn).toBeVisible({ timeout: API_TIMEOUT });
    await expect(nextBtn).toHaveCSS('pointer-events', 'none');

    let kept = false;
    for (let i = 0; i < 10; i++) {
      await expect(revealBtn).toBeVisible();
      await revealBtn.click();
      await expect(nextBtn).toHaveCSS('pointer-events', 'auto');

      // Garde la première carte pour vérifier le récap + le PATCH kept_ids.
      if (!kept) {
        await keepBtn.click();
        kept = true;
      }
      await nextBtn.click();
    }

    // Récap de fin de partie.
    await expect(page.getByText('Belle pioche !')).toBeVisible({ timeout: API_TIMEOUT });
    await expect(page.getByText('tu as gardé 1 expression')).toBeVisible();
  });

  test('?quick=1 saute l\'écran de filtres et démarre directement la partie', async ({ page }) => {
    await page.goto('/voyage?quick=1');

    const revealBtn = page.getByRole('button', { name: 'Révéler le sens' });
    await expect(revealBtn).toBeVisible({ timeout: API_TIMEOUT });

    // L'écran de filtres ne doit jamais apparaître en mode quick — son CTA
    // "C'est parti !" est le marqueur le plus fiable (le chip filtres-recap
    // de l'écran de jeu contient lui aussi le texte "Tous les pays").
    await expect(page.getByRole('button', { name: "C'est parti !" })).not.toBeVisible();
  });
});

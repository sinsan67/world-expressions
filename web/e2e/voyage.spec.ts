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

    // Le composer (filtres) est replié par défaut derrière les presets (Lot S) —
    // l'ouvrir pour retrouver la CTA "C'est parti !".
    await page.getByRole('button', { name: /Composer mon voyage/ }).click();

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

    // Pont récap → exploration (Lot N2) : partie sans filtre → Atlas.
    const exploreLink = page.getByTestId('recap-explore');
    await expect(exploreLink).toBeVisible();
    await expect(exploreLink).toHaveAttribute('href', '/atlas');
  });

  test('(Lot N2) /voyage?country=fr pré-remplit le composer, ouvert d\'office', async ({ page }) => {
    await page.goto('/voyage?country=fr');

    // Le composer est ouvert sans clic (filtres pré-remplis par l'URL) : son
    // CTA est visible d'emblée…
    await expect(page.getByRole('button', { name: "C'est parti !" })).toBeVisible({ timeout: API_TIMEOUT });
    // …et le chip France est sélectionné (classe chip-on posée par VoyageSetup).
    await expect(page.locator('button.chip-on').filter({ hasText: 'France' })).toBeVisible({ timeout: API_TIMEOUT });
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

  // Régression du bug QA2 "bouton retour Android depuis les filtres → va à la
  // home" (scratchpad/qa-session2-analysis.md) : Voyage.tsx poussait 0 entrée
  // d'historique en entrant en partie, donc le retour physique/navigateur
  // sautait directement à la page précédente réelle plutôt que de reculer
  // dans le jeu.
  test('retour navigateur pendant une partie ramène l\'écran de filtres, pas la home', async ({ page }) => {
    await page.goto('/voyage');

    // "Surprends-moi" (preset Lot S) démarre directement une partie, comme le
    // mode quick — pas besoin d'ouvrir le composer pour ce test.
    const surpriseBtn = page.getByRole('button', { name: /Surprends-moi/ });
    await expect(surpriseBtn).toBeVisible({ timeout: API_TIMEOUT });
    await surpriseBtn.click();

    const revealBtn = page.getByRole('button', { name: 'Révéler le sens' });
    await expect(revealBtn).toBeVisible({ timeout: API_TIMEOUT });
    await expect(page).toHaveURL(/screen=play/);

    await page.goBack();

    // Retour dans le jeu (écran des presets sur /voyage), jamais la home.
    await expect(surpriseBtn).toBeVisible();
    await expect(page).toHaveURL(/\/voyage/);
    await expect(page).not.toHaveURL(/screen=play/);
  });

  // Régression du bug QA2 "session perdue au retour d'app" : un reload
  // (proxy le plus proche, en Playwright, d'un process WebView Android tué
  // puis relancé sur la même URL) doit restaurer la carte en cours via
  // sessionStorage plutôt que de retomber sur l'écran de filtres.
  test('recharger la page en cours de partie restaure la carte via sessionStorage', async ({ page }) => {
    await page.goto('/voyage');

    const surpriseBtn = page.getByRole('button', { name: /Surprends-moi/ });
    await expect(surpriseBtn).toBeVisible({ timeout: API_TIMEOUT });
    await surpriseBtn.click();

    const revealBtn = page.getByRole('button', { name: 'Révéler le sens' });
    const nextBtn = page.getByRole('button', { name: 'Suivante ⏭' });
    await expect(revealBtn).toBeVisible({ timeout: API_TIMEOUT });
    await revealBtn.click();
    await expect(nextBtn).toHaveCSS('pointer-events', 'auto');
    await nextBtn.click();

    // Carte 2/10 affichée avant le reload.
    await expect(page.getByText('carte 2/10')).toBeVisible();

    await page.reload();

    await expect(page.getByText('carte 2/10')).toBeVisible({ timeout: API_TIMEOUT });
    await expect(surpriseBtn).not.toBeVisible();
  });
});

test.describe('Page /voyage — presets (Lot S)', () => {
  test('les presets sont visibles au chargement, composer replié, "Comme la dernière fois" absent en session neuve', async ({ page }) => {
    await page.goto('/voyage');

    await expect(page.getByRole('button', { name: /Surprends-moi/ })).toBeVisible({ timeout: API_TIMEOUT });
    await expect(page.getByRole('button', { name: /Proverbes du monde/ })).toBeVisible({ timeout: API_TIMEOUT });
    await expect(page.getByRole('button', { name: /Destination du jour/ })).toBeVisible({ timeout: API_TIMEOUT });
    await expect(page.getByRole('button', { name: /Comme la dernière fois/ })).not.toBeVisible();

    // Composer replié par défaut : sa CTA n'est pas encore dans le DOM visible.
    await expect(page.getByRole('button', { name: "C'est parti !" })).not.toBeVisible();
  });

  test('"Surprends-moi" démarre directement une partie', async ({ page }) => {
    await page.goto('/voyage');

    const surpriseBtn = page.getByRole('button', { name: /Surprends-moi/ });
    await expect(surpriseBtn).toBeVisible({ timeout: API_TIMEOUT });
    await surpriseBtn.click();

    await expect(page.getByRole('button', { name: 'Révéler le sens' })).toBeVisible({ timeout: API_TIMEOUT });
  });

  test('le composer repliable s\'ouvre et se referme', async ({ page }) => {
    await page.goto('/voyage');

    const toggle = page.getByRole('button', { name: /Composer mon voyage/ });
    const cta = page.getByRole('button', { name: "C'est parti !" });
    await expect(toggle).toBeVisible({ timeout: API_TIMEOUT });
    await expect(cta).not.toBeVisible();

    await toggle.click();
    await expect(cta).toBeVisible();

    await toggle.click();
    await expect(cta).not.toBeVisible();
  });

  test('"Comme la dernière fois" apparaît après une partie composée et relance les mêmes filtres', async ({ page }) => {
    await page.goto('/voyage');

    await page.getByRole('button', { name: /Composer mon voyage/ }).click();
    // Anchoré (^…$) : le preset "📜 Proverbes du monde" contient aussi la
    // sous-chaîne "Proverbe", sans ancrage les deux boutons matcheraient.
    await page.getByRole('button', { name: /^📜\s*Proverbe$/ }).click();
    const cta = page.getByRole('button', { name: "C'est parti !" });
    await expect(cta).toBeEnabled({ timeout: API_TIMEOUT });
    await cta.click();

    const revealBtn = page.getByRole('button', { name: 'Révéler le sens' });
    await expect(revealBtn).toBeVisible({ timeout: API_TIMEOUT });

    // Nouvelle navigation fraîche sur /voyage : localStorage a mémorisé le
    // filtre "Proverbe" (web/lib/voyagePersistence.ts, socle du Lot H).
    await page.goto('/voyage');
    const lastTimeBtn = page.getByRole('button', { name: /Comme la dernière fois/ });
    await expect(lastTimeBtn).toBeVisible({ timeout: API_TIMEOUT });
    await expect(lastTimeBtn).toContainText('Proverbe');

    await lastTimeBtn.click();
    await expect(revealBtn).toBeVisible({ timeout: API_TIMEOUT });
  });
});

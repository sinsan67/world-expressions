import { test, expect, type Page, type Browser } from '@playwright/test';

// /revision appelle le backend Render (game-sessions) côté client, comme
// /voyage — voir e2e/voyage.spec.ts. Passer VERCEL_BYPASS_TOKEN pour tester
// sur staging (web/e2e/random.spec.ts). En local (BASE_URL=http://localhost:3000)
// ça passe sans token.
//
// playwright.config.ts pré-remplit localStorage wex_lang=fr — on peut donc
// matcher le texte français exact des labels (lib/revisionLabels.ts).

const T = 90_000;

// Le state "playable" (≥5 favoris) doit démarrer une vraie game-session
// côté backend (POST /game-sessions hydrate les ids envoyés) — il faut donc
// des ids d'expression qui existent réellement en base, pas des ids
// inventés. On les récupère via /random (même pattern que
// e2e/expression.spec.ts's beforeAll), au lieu de les coder en dur.
async function collectRandomExpressionIds(browser: Browser, count: number): Promise<string[]> {
  const ids: string[] = [];
  const page = await browser.newPage();
  while (ids.length < count) {
    await page.goto('/random');
    await page.waitForURL(/\/expression\//, { timeout: T });
    const id = new URL(page.url()).pathname.replace('/expression/', '');
    if (!ids.includes(id)) ids.push(id);
  }
  await page.close();
  return ids;
}

// Sème le carnet local (v2 — voir lib/carnet.ts) avec des favoris "fresh"
// (reviewedAt: null), même shape que celle produite par toggleFavorite().
async function seedFavorites(page: Page, expressionIds: string[]) {
  await page.evaluate((ids) => {
    const carnet = {
      version: 2,
      user: { pseudo: null, createdAt: new Date().toISOString(), syncedAccountId: null },
      favorites: ids.map((expressionId) => ({
        expressionId,
        savedAt: new Date().toISOString(),
        reviewBox: 0,
        reviewedAt: null,
        sessionId: null,
      })),
      history: [],
      notes: [],
      stats: { streakDays: 0, lastActiveDate: '' },
      languageModes: {},
    };
    localStorage.setItem('wex_carnet', JSON.stringify(carnet));
    localStorage.setItem('wex_lang', 'fr');
  }, expressionIds);
}

test.describe('Page /revision', () => {
  test('état verrouillé avec moins de 5 favoris (decision #2)', async ({ page }) => {
    await page.goto('/');
    await seedFavorites(page, ['un-seul-favori']);
    await page.goto('/revision');

    // 5 - 1 favori = 4 manquants (lib/revisionLabels.ts locked.pairing).
    await expect(page.getByText('Garde encore 4 expressions')).toBeVisible({ timeout: T });
  });

  test('état vide sans aucun favori — rebond vers Voyage', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('wex_carnet');
      localStorage.setItem('wex_lang', 'fr');
    });
    await page.goto('/revision');

    await expect(page.getByText('Rien à réviser pour l\'instant')).toBeVisible({ timeout: T });
    await expect(page.getByRole('link', { name: 'Partir en Voyage ▸' })).toBeVisible();
  });

  test('≥5 favoris : retourner → répondre → suivante → récap', async ({ page, browser }) => {
    const ids = await collectRandomExpressionIds(browser, 5);
    await page.goto('/');
    await seedFavorites(page, ids);
    await page.goto('/revision');

    const flipBtn = page.getByRole('button', { name: 'Retourner la carte' });
    const knewBtn = page.getByRole('button', { name: 'Je savais ✅' });

    await expect(flipBtn).toBeVisible({ timeout: T });
    // Actions désactivées tant que la carte n'est pas retournée.
    await expect(knewBtn).toHaveCSS('pointer-events', 'none');

    for (let i = 0; i < 5; i++) {
      await expect(page.getByRole('button', { name: 'Retourner la carte' })).toBeVisible({ timeout: T });
      await page.getByRole('button', { name: 'Retourner la carte' }).click();
      await expect(page.getByRole('button', { name: 'Je savais ✅' })).toHaveCSS('pointer-events', 'auto');
      await page.getByRole('button', { name: 'Je savais ✅' }).click();
    }

    // Récap de fin de session (5 favoris = pas de "Rejouer", le pool entier tient dans une session).
    await expect(page.getByText('Révision terminée !')).toBeVisible({ timeout: T });
    await expect(page.getByText('5/5 déjà sues')).toBeVisible();
  });
});

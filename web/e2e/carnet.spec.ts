import { test, expect } from '@playwright/test';

const T = 90_000;

// Pré-remplir le localStorage avec des données de test
async function seedCarnet(page: import('@playwright/test').Page) {
  await page.evaluate(() => {
    const carnet = {
      version: 1,
      user: { pseudo: null, createdAt: new Date().toISOString(), syncedAccountId: null },
      favorites: [
        { expressionId: "avoir-le-cafard", savedAt: new Date().toISOString() },
        { expressionId: "casser-les-pieds", savedAt: new Date().toISOString() },
      ],
      history: [
        { expressionId: "avoir-le-cafard", region: "fr", language: "fr", viewedAt: new Date().toISOString() },
        { expressionId: "casser-les-pieds", region: "fr", language: "fr", viewedAt: new Date().toISOString() },
      ],
      notes: [],
      stats: { streakDays: 3, lastActiveDate: new Date().toISOString().slice(0, 10) },
    };
    localStorage.setItem('wex_carnet', JSON.stringify(carnet));
    localStorage.setItem('wex_lang', 'fr');
  });
}

// FIXME (S132): le carnet a migré vers /profile#carnet et tout son contenu est
// désormais derrière un mur d'authentification (CarnetTab: `if (!session) return`),
// avec les favoris servis par l'API (plus le localStorage que seedCarnet remplit).
// Ces tests tournent sans session → onglets/stats/export/bannière ne sont jamais
// rendus : ils passaient à vide (faux verts) en testant une archi disparue.
// À RÉÉCRIRE au chantier 8 (auth E2E) — voir prompts-audit-bob-1 en mémoire projet.
test.describe.fixme('Page /carnet (à réécrire — carnet derrière auth sur /profile, chantier 8)', () => {
  test('#50 se charge et affiche la carte de profil (CoverCard)', async ({ page }) => {
    await page.goto('/');
    await seedCarnet(page);
    await page.goto('/carnet');
    await expect(page.locator('main, [role="main"]').first()).toBeVisible({ timeout: T });
  });

  test('#51 les tuiles de statistiques affichent des chiffres', async ({ page }) => {
    await page.goto('/');
    await seedCarnet(page);
    await page.goto('/carnet');
    await page.locator('main, [role="main"]').first().waitFor({ timeout: T });
    // Au moins une tuile de stat visible (wrapped in .wex-atlas-card)
    await expect(page.locator('.wex-atlas-card').first()).toBeVisible({ timeout: T });
  });

  test('#55 onglet Historique est cliquable et affiche les entrées', async ({ page }) => {
    await page.goto('/');
    await seedCarnet(page);
    await page.goto('/carnet');
    await page.locator('main, [role="main"]').first().waitFor({ timeout: T });
    const historyTab = page.locator('[role="tab"]').filter({ hasText: /historique|history/i }).first();
    if (await historyTab.isVisible({ timeout: T }).catch(() => false)) {
      await historyTab.click();
      await page.waitForTimeout(500);
      // L'onglet Historique doit afficher les 2 entrées seedées
      const items = page.locator('[class*="history"], [class*="History"], [class*="list"] li, [class*="item"]');
      expect(await items.count()).toBeGreaterThanOrEqual(1);
    }
  });

  test('#56 onglet Notes est cliquable', async ({ page }) => {
    await page.goto('/');
    await seedCarnet(page);
    await page.goto('/carnet');
    await page.locator('main, [role="main"]').first().waitFor({ timeout: T });
    const notesTab = page.locator('[role="tab"]').filter({ hasText: /notes?/i }).first();
    if (await notesTab.isVisible({ timeout: T }).catch(() => false)) {
      await notesTab.click();
      await page.waitForTimeout(300);
      // L'onglet Notes doit être actif (pas d'erreur)
      await expect(page.locator('main')).toBeVisible();
    }
  });

  test('#58 bannière "Mode local" est dismissable', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('wex_lang', 'fr');
      // S'assurer que la bannière n'est pas déjà dismissée
      const carnet = JSON.parse(localStorage.getItem('wex_carnet') || '{"version":1,"user":{},"favorites":[],"history":[],"notes":[],"stats":{"streakDays":0,"lastActiveDate":""}}');
      carnet.user.bannerDismissed = false;
      localStorage.setItem('wex_carnet', JSON.stringify(carnet));
    });
    await page.goto('/carnet');
    await page.locator('main, [role="main"]').first().waitFor({ timeout: T });
    const closeBtn = page.locator('button[aria-label*="fermer"], button[aria-label*="close"], button').filter({ hasText: /✕|×|close|fermer/i }).first();
    if (await closeBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await closeBtn.click();
      await expect(closeBtn).not.toBeVisible();
    }
  });

  test('#59 bouton Export JSON télécharge un fichier', async ({ page }) => {
    await page.goto('/');
    await seedCarnet(page);
    await page.goto('/carnet');
    await page.locator('main, [role="main"]').first().waitFor({ timeout: T });
    const downloadPromise = page.waitForEvent('download', { timeout: 10000 }).catch(() => null);
    const exportBtn = page.locator('button').filter({ hasText: /json/i }).first();
    if (await exportBtn.isVisible({ timeout: T }).catch(() => false)) {
      await exportBtn.click();
      const download = await downloadPromise;
      if (download) {
        expect(download.suggestedFilename()).toMatch(/\.json$/);
      }
    }
  });

  test('#60 bouton Export CSV télécharge un fichier', async ({ page }) => {
    await page.goto('/');
    await seedCarnet(page);
    await page.goto('/carnet');
    await page.locator('main, [role="main"]').first().waitFor({ timeout: T });
    const downloadPromise = page.waitForEvent('download', { timeout: 10000 }).catch(() => null);
    const exportBtn = page.locator('button').filter({ hasText: /csv/i }).first();
    if (await exportBtn.isVisible({ timeout: T }).catch(() => false)) {
      await exportBtn.click();
      const download = await downloadPromise;
      if (download) {
        expect(download.suggestedFilename()).toMatch(/\.csv$/);
      }
    }
  });

  test('#61 sidebar affiche le count de favoris mis à jour', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('wex_lang', 'fr');
      localStorage.removeItem('wex_carnet');
    });
    await page.reload();
    // Pas de favoris → pas de count visible
    const countBefore = await page.locator('.wex-sidebar a[href="/carnet"] span').last().textContent().catch(() => '');
    // Simuler un toggle favori via l'événement
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('wex-carnet-updated'));
    });
    // Le sidebar se met à jour sans rechargement
    await expect(page.locator('.wex-sidebar')).toBeVisible();
  });
});

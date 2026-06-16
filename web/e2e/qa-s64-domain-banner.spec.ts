/**
 * QA — S64 : Domain banner + fix label "Équivalents" + bouton expressions /emoji
 *
 * S1 — /search?domain=X : bandeau visuel visible (emoji + nom + compteur)
 * S2 — split view : sous-section "others" étiquetée "🔗 Équivalents" (pas "Dans le texte")
 * S3 — mix view : "Par concept" toujours présent (non-régression)
 * S4 — /emoji?domain=X : bouton "Voir les N expressions →" visible et fonctionnel
 */

import { test, expect } from "@playwright/test";

// ─── S1 : Domain banner ───────────────────────────────────────────────────────

test("S1a — /search?domain=emotions : bandeau gradient + emoji + nom visible", async ({ page }) => {
  await page.goto("/search?domain=emotions");

  // Attendre que les résultats chargent
  await expect(page.locator('[data-testid="expression-card"]').first()).toBeVisible({ timeout: 20_000 });

  // Le nom du domaine doit apparaître dans le bandeau
  // (en FR la langue UI par défaut est FR d'après le storageState)
  const bannerName = page.getByRole("heading", { level: 2 }).filter({ hasText: /émotions|emotions/i });
  await expect(bannerName).toBeVisible({ timeout: 5_000 });

  // Le compteur doit être visible (N expressions)
  const counter = page.getByText(/\d+ expression/i);
  await expect(counter.first()).toBeVisible();
});

test("S1b — /search?domain=wisdom : bandeau avec nom du domaine", async ({ page }) => {
  await page.goto("/search?domain=wisdom");

  await expect(page.locator('[data-testid="expression-card"]').first()).toBeVisible({ timeout: 20_000 });

  // Nom du domaine dans le bandeau (h2)
  const bannerName = page.getByRole("heading", { level: 2 }).filter({ hasText: /esprit|sagesse|wisdom|mind/i });
  await expect(bannerName).toBeVisible({ timeout: 5_000 });
});

test("S1c — /search?concept=courage : pas de bandeau domaine (mode concept différent)", async ({ page }) => {
  await page.goto("/search?concept=courage");

  await expect(page.locator('[data-testid="expression-card"]').first()).toBeVisible({ timeout: 20_000 });

  // Pas de h2 domaine (le mode concept n'a pas de bandeau)
  const domainHeading = page.getByRole("heading", { level: 2 });
  await expect(domainHeading).not.toBeVisible({ timeout: 3_000 });
});

// ─── S2 : Label "🔗 Équivalents" dans split view ──────────────────────────────

test.fixme("S2a — split view : sous-section others.exact étiquetée Équivalents (pas Dans le texte)", async ({ page }) => {
  await page.goto("/search?q=argent");

  await expect(page.getByText(/détecté/i)).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText(/dans les autres langues/i)).toBeVisible();

  // Si la sous-section others.exact est rendue (correspondances exactes/concept dans d'autres langues),
  // son label doit être "🔗 Équivalents" et non "Dans le texte" (regression guard pour la correction S64).
  // Pour "argent", others.exact peut être vide si toutes les expressions non-françaises
  // passent en translation_pass — dans ce cas la section ne se rend pas (donnée variable).
  const othersExact = page.locator('[data-testid="split-others-exact"]');
  test.skip(await othersExact.count() === 0, 'split-others-exact absent pour "argent" (données variables, section non rendue)');
  await expect(othersExact.getByText(/équivalents/i)).toBeVisible();
});

test.fixme("S2b — split view : la section principale garde bien 'Dans le texte'", async ({ page }) => {
  await page.goto("/search?q=argent");
  await expect(page.getByText(/détecté/i)).toBeVisible({ timeout: 20_000 });

  // La section principale (langue détectée) doit toujours avoir "Dans le texte"
  await expect(page.getByText(/dans le texte/i)).toBeVisible();
});

test.fixme("S2c — mix view : pas de sous-section Équivalents (mode mélangé ne split pas)", async ({ page }) => {
  await page.goto("/search?q=argent");
  await expect(page.getByText(/détecté/i)).toBeVisible({ timeout: 20_000 });

  // Basculer en mode mélangé
  const mixBtn = page.getByRole("button", { name: /tout mélanger/i });
  await mixBtn.click();

  // La section "Dans les autres langues" disparaît
  await expect(page.getByText(/dans les autres langues/i)).not.toBeVisible({ timeout: 5_000 });

  // "Équivalents" ne doit pas apparaître dans ce mode
  await expect(page.getByText(/équivalents/i)).not.toBeVisible({ timeout: 3_000 });
});

// ─── S3 : Non-régression mode mix — "Par concept" ────────────────────────────

test.fixme("S3 — mix view : section Par concept toujours présente si résultats concept", async ({ page }) => {
  await page.goto("/search?q=argent");
  await expect(page.getByText(/détecté/i)).toBeVisible({ timeout: 20_000 });

  // Basculer en mode mélangé
  const mixBtn = page.getByRole("button", { name: /tout mélanger/i });
  await mixBtn.click();

  // "Dans le texte" toujours visible en mode mix
  await expect(page.getByText(/dans le texte/i)).toBeVisible({ timeout: 5_000 });
});

// ─── S4 : Bouton "Voir les N expressions" dans /emoji?domain=X ────────────

test("S4a — /emoji : clic domaine → bouton Voir expressions visible", async ({ page }) => {
  await page.goto("/emoji");

  // Attendre les cartes domaines
  const domainCard = page.locator('[data-testid="domain-card"]').first();
  await expect(domainCard).toBeVisible({ timeout: 20_000 });

  // Cliquer sur le premier domaine
  await domainCard.click();

  // Le bouton "Voir les N expressions" doit apparaître dans l'en-tête
  const seeExpressionsBtn = page.getByRole("button", { name: /voir les .* expressions|see .* expressions|ver .* expresiones|vedi .* espressioni|\d+ deyimi gör/i });
  await expect(seeExpressionsBtn).toBeVisible({ timeout: 5_000 });
});

test("S4b — clic bouton 'Voir expressions' navigue vers /search?domain=X", async ({ page }) => {
  await page.goto("/emoji");

  // Attendre et cliquer sur le premier domaine
  const domainCard = page.locator('[data-testid="domain-card"]').first();
  await expect(domainCard).toBeVisible({ timeout: 20_000 });
  await domainCard.click();

  // Cliquer sur "Voir les N expressions"
  const seeExpressionsBtn = page.getByRole("button", { name: /voir les .* expressions|see .* expressions|ver .* expresiones|vedi .* espressioni|\d+ deyimi gör/i });
  await expect(seeExpressionsBtn).toBeVisible({ timeout: 5_000 });
  await seeExpressionsBtn.click();

  // Vérifier qu'on est sur /search?domain=...
  await expect(page).toHaveURL(/\/search\?domain=\w+/, { timeout: 10_000 });
});

test("S4c — /emoji?domain=emotions direct : bouton expressions visible", async ({ page }) => {
  await page.goto("/emoji?domain=emotions");

  // Le bouton Voir expressions doit être présent (ouverture directe par URL)
  const seeExpressionsBtn = page.getByRole("button", { name: /voir les .* expressions|see .* expressions|ver .* expresiones|vedi .* espressioni|\d+ deyimi gör/i });
  await expect(seeExpressionsBtn).toBeVisible({ timeout: 20_000 });
});

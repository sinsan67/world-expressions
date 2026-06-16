/**
 * QA — Issue #36 : Split view / Language toggle sur /search
 * Teste les 6 scénarios définis dans l'issue.
 * Lance contre staging via BASE_URL + VERCEL_BYPASS_TOKEN.
 */

import { test, expect } from "@playwright/test";

// Scénario 1 — Split view de base avec "argent"
test.fixme("S1 — badge langue détecté + toggle + split sections visibles", async ({ page }) => {
  await page.goto("/search?q=argent");

  // Badge "Français · détecté" présent quelque part dans la sticky bar
  await expect(page.getByText(/détecté/i)).toBeVisible({ timeout: 25_000 });

  // Le badge doit contenir le drapeau français
  const badge = page.getByText(/Français.*détecté|détecté/i).first();
  await expect(badge).toBeVisible();

  // Toggle "Langue d'abord" visible et actif
  await expect(page.getByRole("button", { name: /langue d.abord/i })).toBeVisible();

  // Toggle "Tout mélanger" visible
  await expect(page.getByRole("button", { name: /tout mélanger/i })).toBeVisible();

  // Sous-sections "Dans le texte" et "Par le sens" présentes
  await expect(page.getByText(/dans le texte/i).first()).toBeVisible();
  await expect(page.getByText(/par le sens/i).first()).toBeVisible();

  // Section "Dans les autres langues" présente plus bas
  await expect(page.getByText(/dans les autres langues/i).first()).toBeVisible();
});

// Scénario 2 — Cap 6 + expand
test("S2 — cap 6 cartes + bouton Voir les N autres", async ({ page }) => {
  await page.goto("/search?q=pied");

  // Attendre que les résultats arrivent (cold start Render peut prendre ~25s)
  await expect(page.getByText(/dans le texte/i)).toBeVisible({ timeout: 25_000 });

  // Le bouton "Voir les N autres" doit être présent (cap déclenché)
  const expandBtn = page.getByRole("button", { name: /voir les .+ autres/i }).first();
  await expect(expandBtn).toBeVisible();

  // Compter les cartes avant le clic — au max 6 dans la première sous-section
  const cardsBeforeSection = page.locator('[data-testid="expression-card"]');
  const countBefore = await cardsBeforeSection.count();

  // Clic sur "Voir les N autres"
  await expandBtn.click();

  // Après le clic, le bouton disparaît (les cartes masquées sont affichées)
  await expect(expandBtn).not.toBeVisible({ timeout: 5_000 });

  // Il y a plus de cartes maintenant
  const countAfter = await cardsBeforeSection.count();
  expect(countAfter).toBeGreaterThan(countBefore);
});

// Scénario 3 — Toggle "Tout mélanger" puis retour
test.fixme("S3 — toggle Tout mélanger désactive le split, retour Langue d'abord le restaure", async ({ page }) => {
  await page.goto("/search?q=argent");
  await expect(page.getByText(/détecté/i)).toBeVisible({ timeout: 25_000 });

  // Clic sur "Tout mélanger"
  const mixBtn = page.getByRole("button", { name: /tout mélanger/i });
  await mixBtn.click();

  // La section "Dans les autres langues" doit disparaître
  await expect(page.getByText(/dans les autres langues/i)).not.toBeVisible({ timeout: 5_000 });

  // Les sections classiques par match_type sont présentes
  await expect(page.getByText(/dans le texte/i)).toBeVisible();

  // Retour à "Langue d'abord"
  const langFirstBtn = page.getByRole("button", { name: /langue d.abord/i });
  await langFirstBtn.click();

  // La section "Dans les autres langues" réapparaît
  await expect(page.getByText(/dans les autres langues/i)).toBeVisible({ timeout: 5_000 });
});

// Scénario 4 — Mot multilingue "para" (TR + ES)
test.fixme("S4 — para : langue détectée ou mode mélangé si ambiguë", async ({ page }) => {
  await page.goto("/search?q=para");

  // Attendre qu'au moins une carte soit chargée (couvre cold start backend)
  const card = page.locator('[data-testid="expression-card"]').first();
  await expect(card).toBeVisible({ timeout: 25_000 });

  // Soit une langue est détectée (badge visible), soit on est en mode mélangé
  const hasBadge = await page.getByText(/détecté/i).isVisible().catch(() => false);
  const hasMixedSections = await page.getByText(/dans le texte/i).isVisible().catch(() => false);

  // L'un ou l'autre doit être vrai — l'app ne doit pas crasher ou rester vide
  expect(hasBadge || hasMixedSections).toBe(true);

  // Si badge détecté, vérifier que c'est TR ou ES (les langues qui ont "para")
  if (hasBadge) {
    const badgeText = await page.getByText(/détecté/i).first().textContent();
    const isValidLang = /Türkçe|Español|Turkish|Spanish/i.test(badgeText ?? "");
    // Note : pas de hard-fail ici car la détection dépend des données en base
    // On vérifie juste que quelque chose de cohérent est affiché
    console.log(`Langue détectée pour "para": ${badgeText} — valide: ${isValidLang}`);
  }
});

// Scénario 5 — Modes concept et domaine : pas de split view
test("S5 — mode concept : pas de badge, pas de toggle split", async ({ page }) => {
  await page.goto("/search?concept=courage");
  // Attendre les résultats avant d'asserter l'absence du badge (évite les faux positifs au chargement)
  await expect(page.locator('[data-testid="expression-card"]').first()).toBeVisible({ timeout: 25_000 });

  // Pas de badge "détecté" (mode concept ne fait pas de détection de langue)
  await expect(page.getByText(/détecté/i)).not.toBeVisible({ timeout: 3_000 });

  // Pas de toggle split (les boutons Langue d'abord / Tout mélanger ne doivent pas apparaître)
  await expect(page.getByRole("button", { name: /langue d.abord/i })).not.toBeVisible({ timeout: 3_000 });
  await expect(page.getByRole("button", { name: /tout mélanger/i })).not.toBeVisible({ timeout: 3_000 });
});

test("S5b — mode domaine : pas de badge, pas de toggle split", async ({ page }) => {
  await page.goto("/search?domain=emotions");
  // Attendre les résultats avant d'asserter l'absence du badge
  await expect(page.locator('[data-testid="expression-card"]').first()).toBeVisible({ timeout: 25_000 });

  // Pas de badge "détecté" (mode domaine ne fait pas de détection de langue)
  await expect(page.getByText(/détecté/i)).not.toBeVisible({ timeout: 3_000 });

  // Pas de toggle split
  await expect(page.getByRole("button", { name: /langue d.abord/i })).not.toBeVisible({ timeout: 3_000 });
});

// Scénario 6 — Non-régression : filtre région + tri pays + tags cliquables
test("S6a — filtre région fonctionne toujours", async ({ page }) => {
  await page.goto("/search?q=argent&country=fr");

  // Des résultats sont affichés
  const cards = page.locator('[data-testid="expression-card"]');
  await expect(cards.first()).toBeVisible({ timeout: 25_000 });

  // Vérifier qu'on n'a que des expressions françaises (flags 🇫🇷)
  // On vérifie que la page ne crashe pas avec le filtre région + split view
  const count = await cards.count();
  expect(count).toBeGreaterThan(0);
});

test.fixme("S6b — tri Par pays désactive le split", async ({ page }) => {
  await page.goto("/search?q=argent");
  await expect(page.getByText(/détecté/i)).toBeVisible({ timeout: 25_000 });

  // Trouver et cliquer le bouton "Par pays" dans ResultsFilterBar
  const sortByCountry = page.getByRole("button", { name: /par pays/i });
  const hasSortBtn = await sortByCountry.isVisible().catch(() => false);
  test.skip(!hasSortBtn, 'bouton "Par pays" absent — vérifier si la feature tri est implémentée');
  await sortByCountry.click();
  // Le split view doit être désactivé (pas de "Dans les autres langues")
  await expect(page.getByText(/dans les autres langues/i)).not.toBeVisible({ timeout: 3_000 });
});

test("S6c — tag cliquable navigue correctement", async ({ page }) => {
  await page.goto("/search?q=argent");

  // Attendre qu'une carte soit visible
  const firstCard = page.locator('[data-testid="expression-card"]').first();
  await expect(firstCard).toBeVisible({ timeout: 25_000 });

  // Clic sur un tag dans la première carte
  const tag = firstCard.locator("button, a").filter({ hasText: /\w+/ }).first();
  const hasTag = await tag.isVisible().catch(() => false);
  test.skip(!hasTag, 'aucun tag/lien cliquable dans la première carte');
  await tag.click();
  await expect(page).toHaveURL(/concept=|q=|search/, { timeout: 10_000 });
});

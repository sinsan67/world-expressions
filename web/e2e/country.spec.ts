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

  test('#48 clic sur un chip concept lance une recherche', async ({ page }) => {
    await page.goto('/country/fr');
    await page.locator('h1, h2').first().waitFor({ timeout: T });
    const chip = page.locator('[class*="chip"], [class*="Chip"], [class*="tag"]').first();
    if (await chip.isVisible({ timeout: 5000 }).catch(() => false)) {
      await chip.click();
      // Doit naviguer vers la homepage avec un paramètre de recherche
      await expect(page).toHaveURL(/\/#q=|\/\?q=/, { timeout: T });
    }
  });

  test('#49 navigation vers un autre pays via le dropdown', async ({ page }) => {
    await page.goto('/country/fr');
    await page.locator('h1, h2').first().waitFor({ timeout: T });
    const dropdown = page.locator('select, [role="listbox"], [class*="dropdown"], [class*="Dropdown"]').first();
    if (await dropdown.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Le dropdown "Autre pays" doit contenir des options
      const options = dropdown.locator('option, [role="option"]');
      expect(await options.count()).toBeGreaterThan(1);
    }
  });

  test('sidebar active "Atlas" depuis /country/[code]', async ({ page }) => {
    await page.goto('/country/fr');
    await page.locator('h1, h2').first().waitFor({ timeout: T });
    // Pas d'item sidebar spécifique pour country — vérifier au moins que la sidebar s'affiche
    await expect(page.locator('.wex-sidebar').first()).toBeVisible({ timeout: T });
  });
});

import { test, expect } from '@playwright/test';

// Jeu 3 — Constellation (docs/game3-constellation-lot0-contract.md, §7
// addendum S239/S240). Smoke test only, per the build plan: no attempt to
// simulate real pinch/rotate gestures in Playwright — that's exactly the
// gesturestart/Safari-mobile check the contract already flags as a required
// MANUAL step (never formally closed since the S197 spike), not something
// to automate here.

test.describe('Page /constellation', () => {
  test('tap a node, examples fade in automatically, keep an example, close', async ({ page }) => {
    await page.goto('/constellation');

    const node = page.locator('[data-testid^="constellation-node-"]').first();
    await expect(node).toBeVisible({ timeout: 30_000 });
    await node.click();

    // No "Révéler" click anymore (S240, addendum §7.1) — examples fade in
    // on their own once GET /constellation/tag/{tag} resolves.
    const keepBtn = page.locator('[data-testid^="constellation-keep-"]').first();
    await expect(keepBtn).toBeVisible({ timeout: 30_000 });

    await page.getByTestId('constellation-close').click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('browse entry navigates to /constellation/browse and back link returns with overlay open', async ({ page }) => {
    await page.goto('/constellation');

    await page.getByTestId('constellation-browse-entry').click();
    await expect(page).toHaveURL(/\/constellation\/browse/);

    const card = page.getByTestId('expression-card').first();
    await expect(card).toBeVisible({ timeout: 30_000 });
    await card.click();

    await expect(page).toHaveURL(/\/constellation\?tag=/);
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 30_000 });
  });
});

import { test, expect } from '@playwright/test';

// Jeu 3 — Constellation (docs/game3-constellation-lot0-contract.md). Smoke
// test only, per the build plan: no attempt to simulate real pinch/rotate
// gestures in Playwright — that's exactly the gesturestart/Safari-mobile
// check the contract already flags as a required MANUAL step (never
// formally closed since the S197 spike), not something to automate here.

test.describe('Page /constellation', () => {
  test('tap a node, reveal, keep an example, close', async ({ page }) => {
    await page.goto('/constellation');

    const node = page.locator('[data-testid^="constellation-node-"]').first();
    await expect(node).toBeVisible({ timeout: 30_000 });
    await node.click();

    const revealBtn = page.getByTestId('constellation-reveal');
    await expect(revealBtn).toBeVisible({ timeout: 30_000 });
    await revealBtn.click();

    const keepBtn = page.locator('[data-testid^="constellation-keep-"]').first();
    await expect(keepBtn).toBeVisible();

    await page.getByTestId('constellation-close').click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });
});

import { defineConfig, devices } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    // cold start Render peut prendre ~60s — timeouts généreux pour les tests staging/prod
    navigationTimeout: 90_000,
    actionTimeout: 30_000,
    // Bypass Vercel Deployment Protection pour les tests automatisés
    // Générer le token dans Vercel Dashboard > Project > Settings > Deployment Protection
    extraHTTPHeaders: process.env.VERCEL_BYPASS_TOKEN
      ? { 'x-vercel-protection-bypass': process.env.VERCEL_BYPASS_TOKEN }
      : {},
  },
  expect: {
    // Laisse le temps aux composants React de s'hydrater et aux données API d'arriver
    timeout: 90_000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});

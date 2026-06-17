import { defineConfig, devices } from '@playwright/test';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load .env.playwright if it exists (gitignored — store VERCEL_BYPASS_TOKEN there)
try {
  const lines = readFileSync(resolve(__dirname, '.env.playwright'), 'utf-8').split('\n');
  for (const line of lines) {
    const [key, ...rest] = line.split('=');
    if (key && rest.length && !process.env[key.trim()]) {
      process.env[key.trim()] = rest.join('=').trim();
    }
  }
} catch { /* file absent — ignore */ }

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  timeout: 120_000,
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
    // Pré-setter wex_lang pour éviter que la modal d'onboarding bloque les tests
    storageState: {
      cookies: [],
      origins: [{ origin: BASE_URL, localStorage: [{ name: 'wex_lang', value: 'fr' }] }],
    },
  },
  expect: {
    // Laisse le temps aux composants React de s'hydrater et aux données API d'arriver
    timeout: 90_000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 7'] },
      // Only run specs that contain meaningful mobile-specific tests
      testMatch: ['**/homepage.spec.ts', '**/search-page.spec.ts', '**/type-page.spec.ts'],
    },
  ],
});

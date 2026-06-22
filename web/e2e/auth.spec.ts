// Auth — register / login / wrong password / /profile access / logout
// Test account: ssin@protonmail.com — deleted by reset_test_account.py before each CI run
// Local pre-req: DATABASE_URL=<staging_url> python3 scripts/reset_test_account.py --email ssin@protonmail.com
import { test, expect, Page } from '@playwright/test';

const T = 90_000;
const TEST_EMAIL = 'ssin@protonmail.com';
const TEST_PASSWORD = process.env.TEST_AUTH_PASSWORD || 'TestAuth@2026';

// Tests must run serially: each depends on the account existing in DB after #A1
// Serial mode in Playwright skips subsequent tests when one fails
test.describe.configure({ mode: 'serial' });

test.beforeEach(async ({ page }) => {
  // Force English UI — modal text and button labels are in English
  await page.addInitScript(() => localStorage.setItem('wex_lang', 'en'));
});

// Helper: log in with the test account and wait for session to establish
async function loginTestAccount(page: Page) {
  await page.goto('/');
  await page.getByTestId('auth-btn-main').click();
  await page.getByTestId('auth-dropdown-signin').click();
  const modal = page.getByTestId('auth-modal');
  await modal.waitFor({ timeout: T });
  await modal.getByPlaceholder('Email').fill(TEST_EMAIL);
  await modal.getByPlaceholder('Password').fill(TEST_PASSWORD);
  await modal.getByRole('button', { name: /^Sign in$/i }).click();
  await expect(modal).not.toBeVisible({ timeout: T });
  await expect(page.locator('a[href="/profile#account"]')).toBeVisible({ timeout: T });
  // Dismiss onboarding modal if shown (AuthGate fires after first login per device)
  await page.getByRole('button', { name: /skip for now/i }).click({ timeout: 5000 }).catch(() => {});
}

test.describe('Auth — register / login / logout', () => {
  test('#A1 register: new account shows success banner', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('auth-btn-main').click();
    await page.getByTestId('auth-dropdown-register').click();

    const modal = page.getByTestId('auth-modal');
    await modal.waitFor({ timeout: T });

    await modal.getByPlaceholder('Email').fill(TEST_EMAIL);
    await modal.getByPlaceholder(/password/i).fill(TEST_PASSWORD);
    await modal.getByRole('button', { name: /create account/i }).click();

    await expect(modal.getByText(/account created/i)).toBeVisible({ timeout: T });
  });

  test('#A2 login: email+password flow succeeds (BUG-AUTH-002)', async ({ page }) => {
    await loginTestAccount(page);
    // Logged-in badge (link to profile) is visible — session is established
    await expect(page.locator('a[href="/profile#account"]')).toBeVisible({ timeout: T });
  });

  test('#A3 wrong password: shows error message', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('auth-btn-main').click();
    await page.getByTestId('auth-dropdown-signin').click();

    const modal = page.getByTestId('auth-modal');
    await modal.waitFor({ timeout: T });

    await modal.getByPlaceholder('Email').fill(TEST_EMAIL);
    await modal.getByPlaceholder('Password').fill('wrong-password-xyz');
    await modal.getByRole('button', { name: /^Sign in$/i }).click();

    await expect(modal.getByText(/invalid email or password/i)).toBeVisible({ timeout: T });
    // Modal stays open — user is not logged in
    await expect(modal).toBeVisible();
  });

  test('#A4 /profile: accessible and shows account tab when logged in', async ({ page }) => {
    await loginTestAccount(page);
    await page.goto('/profile#account');
    // Account tab loads (hash triggers setActiveTab("account") in useEffect)
    await expect(page.getByRole('button', { name: /sign out/i })).toBeVisible({ timeout: T });
    // User's email is visible in the account card
    await expect(page.getByText(TEST_EMAIL, { exact: true })).toBeVisible({ timeout: T });
  });

  test('#A5 logout: sign out redirects to / and clears session', async ({ page }) => {
    await loginTestAccount(page);
    await page.goto('/profile#account');
    await page.getByRole('button', { name: /sign out/i }).click();
    // NextAuth redirects to callbackUrl: "/"
    await page.waitForURL('/', { timeout: T });
    // Terra auth button is back — no active session
    await expect(page.getByTestId('auth-btn-main')).toBeVisible({ timeout: T });
  });
});

/* Drive the Random mode feature end-to-end on localhost:3000. */
const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch();
  const log = (s) => console.log(s);

  // ── Desktop: /random-mode entry → roll → flip → nav ──
  const d = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await d.goto("http://localhost:3000/random-mode", { waitUntil: "networkidle" });
  log("entry-visible: " + (await d.getByText(/Roll the dice|Lancer le dé/).first().isVisible()));
  await d.screenshot({ path: "/tmp/v1-entry-desktop.png" });

  // sidebar has the plum Random item
  log("sidebar-random: " + (await d.locator('aside a[href="/random-mode"]').count()));

  // filter: Turkey + proverb
  const selects = d.locator("select");
  await selects.nth(0).selectOption("tr");
  await selects.nth(1).selectOption("proverb");
  await d.getByRole("button", { name: /Roll the dice|Lancer le dé/ }).last().click();
  await d.waitForSelector(".wex-flip-wrap", { timeout: 15000 });
  const front1 = await d.locator(".wex-flip-face").first().innerText();
  log("card1-front: " + front1.replace(/\n/g, " | ").slice(0, 120));
  await d.screenshot({ path: "/tmp/v2-card-front.png" });

  // flip
  await d.locator(".wex-flip-wrap").click();
  await d.waitForTimeout(700);
  const flipped = await d.locator(".wex-flip-wrap.flipped").count();
  const backText = await d.locator(".wex-flip-face.back").innerText();
  log("flipped: " + flipped + " | back: " + backText.replace(/\n/g, " | ").slice(0, 120));
  const fullLink = await d.locator('.wex-flip-face.back a[href^="/expression/"]').getAttribute("href");
  log("full-card-link: " + fullLink);
  await d.screenshot({ path: "/tmp/v3-card-back.png" });

  // › new card, › again, ‹ rewind → must equal card 2
  const exprOf = async () =>
    (await d.locator(".wex-flip-face").first().innerText()).split("\n").join("|");
  const c1 = await exprOf();
  await d.getByRole("button", { name: /New card|Nouvelle carte/ }).click();
  await d.waitForTimeout(900);
  const c2 = await exprOf();
  await d.getByRole("button", { name: /New card|Nouvelle carte/ }).click();
  await d.waitForTimeout(900);
  const c3 = await exprOf();
  await d.getByRole("button", { name: /Previous card|Carte précédente/ }).click();
  await d.waitForTimeout(600);
  const back2 = await exprOf();
  log("history-rewind-ok: " + (back2 === c2) + " (distinct cards: " + new Set([c1, c2, c3]).size + "/3)");
  const counter = await d.getByText(/card 2|carte 2/).count();
  log("counter-shows-2: " + counter);

  // ‹ at card 1 must be disabled
  await d.getByRole("button", { name: /Previous card|Carte précédente/ }).click();
  await d.waitForTimeout(600);
  const prevDisabled = await d.getByRole("button", { name: /Previous card|Carte précédente/ }).isDisabled();
  log("prev-disabled-at-1: " + prevDisabled);

  // chip returns to entry with filters kept
  await d.locator("button", { hasText: /All types|Tous les types|Atasözü|Proverb/ }).first().click();
  await d.waitForTimeout(400);
  log("back-to-entry: " + (await d.getByRole("button", { name: /Roll the dice|Lancer le dé/ }).last().isVisible()));
  log("country-kept: " + (await selects.nth(0).inputValue()));

  // 🔍 probe: filters that yield nothing? (country=jp kind=locution may exist; use impossible combo via API check instead)
  const apiProbe = await d.evaluate(async () => {
    const r = await fetch("http://localhost:8000/random?country=xx&kind=proverb");
    return r.status;
  });
  log("probe-unknown-country-status: " + apiProbe);

  // ── Mobile: home nav + heart, search overlay ──
  // Returning-visitor state: language already chosen → no WelcomeModal
  const mCtx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  await mCtx.addInitScript(() => localStorage.setItem("wex_lang", "fr"));
  const m = await mCtx.newPage();
  await m.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await m.waitForTimeout(1500);
  const navItems = await m.locator('[data-testid="bottom-nav"] > *').count();
  log("mobile-nav-items: " + navItems);
  const diceLink = await m.locator('[data-testid="bottom-nav"] a[href="/random-mode"]').count();
  log("mobile-dice-tab: " + diceLink);
  const heroHeart = await m.locator('.wex-mobile-header a[href="/profile"]').count();
  log("hero-heart: " + heroHeart);
  await m.screenshot({ path: "/tmp/v4-mobile-home.png" });

  // search tab opens overlay
  await m.locator('[data-testid="bottom-nav"] button').first().click();
  await m.waitForTimeout(800);
  const overlayInput = await m.locator("input").count();
  await m.screenshot({ path: "/tmp/v5-mobile-search.png" });
  log("search-overlay-inputs: " + overlayInput);
  await m.keyboard.press("Escape");

  // non-home page: heart in fixed global header
  await m.goto("http://localhost:3000/atlas", { waitUntil: "networkidle" });
  const globalHeart = await m.locator('.wex-global-header a[href="/profile"]').isVisible();
  log("atlas-global-heart: " + globalHeart);
  await m.screenshot({ path: "/tmp/v6-mobile-atlas.png" });

  // mobile random mode: dice tab → entry → roll → swipe left = next
  await m.locator('[data-testid="bottom-nav"] a[href="/random-mode"]').click();
  await m.waitForTimeout(1200);
  await m.getByRole("button", { name: /Roll the dice|Lancer le dé/ }).last().click();
  await m.waitForSelector(".wex-flip-wrap", { timeout: 15000 });
  await m.screenshot({ path: "/tmp/v7-mobile-card.png" });
  const mc1 = await m.locator(".wex-flip-face").first().innerText();
  await m.touchscreen.tap(195, 400); // flip via tap
  await m.waitForTimeout(700);
  log("mobile-tap-flips: " + (await m.locator(".wex-flip-wrap.flipped").count()));

  await browser.close();
})().catch((e) => { console.error("FATAL: " + e.message); process.exit(1); });

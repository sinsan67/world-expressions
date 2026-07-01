#!/usr/bin/env node
/**
 * Exporte un ou plusieurs éléments d'un fichier HTML de `social/` en image(s) PNG.
 * Réutilise le Chromium de Playwright déjà installé dans `web/`.
 *
 * Usage :
 *   node social/export-image.cjs <fichier.html> [sélecteur] [scale]
 *
 * Exemples :
 *   node social/export-image.cjs social/cover-facebook.html ".cover" 1
 *   node social/export-image.cjs social/post-icon-launch.html ".slide" 2
 *
 * - sélecteur : CSS de l'élément à capturer (défaut ".slide")
 * - scale     : facteur de résolution (défaut 2 ; une slide 540px × 2 = 1080px)
 *
 * Sortie : à côté du HTML. 1 élément → <base>.png ; plusieurs → <base>-1.png, <base>-2.png…
 */
const path = require('path');
const fs = require('fs');

// Playwright vit dans web/node_modules — on le résout relativement à ce script.
const { chromium } = require(path.join(__dirname, '..', 'web', 'node_modules', 'playwright'));

async function main() {
  const [, , htmlArg, selector = '.slide', scaleArg = '2'] = process.argv;
  if (!htmlArg) {
    console.error('Usage : node social/export-image.cjs <fichier.html> [sélecteur] [scale]');
    process.exit(1);
  }

  const htmlPath = path.resolve(htmlArg);
  if (!fs.existsSync(htmlPath)) {
    console.error(`Fichier introuvable : ${htmlPath}`);
    process.exit(1);
  }
  const scale = parseFloat(scaleArg);
  const outDir = path.dirname(htmlPath);
  const base = path.basename(htmlPath, path.extname(htmlPath));

  const browser = await chromium.launch();
  const page = await browser.newPage({ deviceScaleFactor: scale });
  await page.goto('file://' + htmlPath, { waitUntil: 'networkidle' });
  // Laisse les polices Google Fonts se charger et se peindre.
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);

  const elements = await page.$$(selector);
  if (elements.length === 0) {
    console.error(`Aucun élément « ${selector} » trouvé dans ${base}.`);
    await browser.close();
    process.exit(1);
  }

  for (let i = 0; i < elements.length; i++) {
    const suffix = elements.length === 1 ? '' : `-${i + 1}`;
    const out = path.join(outDir, `${base}${suffix}.png`);
    await elements[i].screenshot({ path: out });
    const { width, height } = await elements[i].boundingBox();
    console.log(`✅ ${path.basename(out)}  (${Math.round(width * scale)}×${Math.round(height * scale)} px)`);
  }

  await browser.close();
}

main().catch((err) => { console.error(err); process.exit(1); });

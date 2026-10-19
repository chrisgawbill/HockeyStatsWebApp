// Renders public/icons/*.svg to the PNGs the manifest and index.html use.
// Usage (from react/): node scripts/generate-icons.mjs
// Needs Playwright (not a project dependency; set PLAYWRIGHT_MODULE to its
// index.mjs if it is not resolvable) and a Chromium (CHROMIUM_PATH overrides
// the default location).
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE || 'playwright'
);

const dir = fileURLToPath(new URL('../public/icons/', import.meta.url));
const jobs = [
  ['icon.svg', 'icon-192.png', 192],
  ['icon.svg', 'icon-512.png', 512],
  ['icon-maskable.svg', 'apple-touch-icon.png', 180],
  ['icon.svg', 'favicon-32.png', 32],
  ['icon-maskable.svg', 'maskable-512.png', 512],
];

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium',
});
const page = await browser.newPage();
for (const [src, out, size] of jobs) {
  const svg = readFileSync(dir + src, 'utf8');
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<style>html,body{margin:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`,
  );
  writeFileSync(dir + out, await page.screenshot({ omitBackground: true }));
}
await browser.close();

// Gera os PNG do favicon e dos ícones a partir dos SVG em public/.
// Uso: node scripts/build-icons.mjs   (precisa de: npx playwright install chromium)
import { chromium } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const jobs = [
  { src: 'public/favicon.svg', out: 'public/favicon-32.png', size: 32 },
  { src: 'public/brand/icon-app.svg', out: 'public/apple-touch-icon.png', size: 180 },
  { src: 'public/brand/icon-app.svg', out: 'public/icon-512.png', size: 512 },
  { src: 'public/brand/icon-app.svg', out: 'public/icon-192.png', size: 192 },
];

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });
for (const { src, out, size } of jobs) {
  const svg = await readFile(root + src, 'utf8');
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<html><body style="margin:0;background:transparent">` +
      svg.replace('<svg ', `<svg style="display:block;width:${size}px;height:${size}px" `) +
      `</body></html>`,
  );
  await page.screenshot({ path: root + out, omitBackground: true });
  console.log('ok', out);
}
await browser.close();

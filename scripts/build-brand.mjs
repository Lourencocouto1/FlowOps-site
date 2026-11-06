// Gera TODOS os ficheiros da marca a partir de um único SVG de origem: public/brand/logo-source.svg.
// Uso: npm run brand   (precisa do Chromium do Playwright: npx playwright install chromium)
//
// Gera:
//   public/brand/  logo-horizontal(-dark).svg, logo-vertical(-dark).svg, symbol(-dark).svg,
//                  mark.svg (só a forma principal, cor herdada: marca de água), icon-app.svg, icon-profile.svg
//   public/        favicon.svg, favicon-32.png, apple-touch-icon.png, icon-192.png, icon-512.png,
//                  icon-maskable-512.png
//   public/og/     default.png (imagem de partilha 1200x630, com o nome e o título da página inicial)
//
// As regras do ficheiro de origem estão no comentário dentro dele.
import { chromium } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { BRAND_NAME, LOCALITY } from '../site.config.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const SOURCE = root + 'public/brand/logo-source.svg';

const C = { green: '#0F766E', aqua: '#5EEAD4', amber: '#F59E0B', ink: '#0F1F1C', white: '#FFFFFF', onInk: '#B8CCC7' };
// Cor de cada papel (classe) em cada versão. Papéis sem cor definida mantêm a cor do ficheiro de origem.
const VARIANTS = {
  light: { mark: C.green, text: C.ink },
  dark: { mark: C.aqua, text: C.white },
  onBrand: { mark: C.white }, // ícones: símbolo branco sobre o verde
};

const source = await readFile(SOURCE, 'utf8');
const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });
await page.setContent(`<html><body style="margin:0">${source}</body></html>`);

// 1. Medir e extrair as partes no browser (bbox real, com transformações).
const parts = await page.evaluate(() => {
  const svg = document.querySelector('svg');
  if (!svg) throw new Error('logo-source.svg sem <svg>');
  const measure = (/** @type {Element|null} */ el, name) => {
    if (!el) throw new Error(`logo-source.svg: falta <g id="${name}">`);
    // Embrulhar num <g> sem transformação: a bbox fica nas coordenadas do <svg>.
    const wrap = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    el.replaceWith(wrap);
    wrap.appendChild(el);
    const b = /** @type {SVGGElement} */ (wrap).getBBox();
    return { x: b.x, y: b.y, w: b.width, h: b.height, markup: el.outerHTML };
  };
  const symbol = measure(svg.querySelector('#symbol'), 'symbol');
  const wordmark = measure(svg.querySelector('#wordmark'), 'wordmark');
  const all = /** @type {SVGSVGElement} */ (svg).getBBox();
  // Só as formas "mark", para a marca de água.
  const markEls = [...svg.querySelectorAll('#symbol .mark')];
  if (!markEls.length) throw new Error('logo-source.svg: o símbolo não tem nenhuma forma com class="mark"');
  const markWrap = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  svg.appendChild(markWrap);
  // Clonar cada forma com as transformações dos antepassados até ao <svg>.
  for (const el of markEls) {
    let node = /** @type {Element} */ (el.cloneNode(true));
    for (let p = el.parentElement; p && p !== svg; p = p.parentElement) {
      if (p.getAttribute('transform')) {
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('transform', p.getAttribute('transform') ?? '');
        g.appendChild(node);
        node = g;
      }
    }
    markWrap.appendChild(node);
  }
  const mb = markWrap.getBBox();
  const markOnly = { x: mb.x, y: mb.y, w: mb.width, h: mb.height, markup: markWrap.innerHTML };
  markWrap.remove();
  return { symbol, wordmark, all: { x: all.x, y: all.y, w: all.width, h: all.height }, markOnly };
});

/** Aplica as cores de uma versão às formas com papel (classe). */
function recolor(markup, colors, { forceCurrentColor = false } = {}) {
  return markup.replace(/<(path|circle|rect|ellipse|polygon|polyline|line)\b([^>]*?)(\/?)>/g, (tag, name, attrs, close) => {
    const role = /\bclass="([^"]*)"/.exec(attrs)?.[1].split(/\s+/).find((c) => c in { mark: 1, accent: 1, 'accent-ink': 1, text: 1 });
    const color = forceCurrentColor ? 'currentColor' : role && colors[role];
    if (!color) return tag;
    const set = (a, attr) => {
      const re = new RegExp(`\\s${attr}="([^"]*)"`);
      const m = re.exec(a);
      if (m && m[1] !== 'none') return a.replace(re, ` ${attr}="${color}"`);
      if (!m && attr === 'fill') return `${a} fill="${color}"`; // fill por omissão é preto
      return a;
    };
    return `<${name}${set(set(attrs, 'fill'), 'stroke')}${close}>`;
  });
}
const clean = (markup) => markup.replace(/\s(id|class)="[^"]*"/g, '');
const n = (v) => +v.toFixed(2);

/** Documento SVG final. height: altura intrínseca em px. */
function svgDoc([x, y, w, h], body, { height, title = BRAND_NAME } = {}) {
  const size = height ? ` width="${Math.round((w * height) / h)}" height="${height}"` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${n(x)} ${n(y)} ${n(w)} ${n(h)}"${size} role="img" aria-labelledby="t"><title id="t">${title}</title>${body}</svg>\n`;
}
/** Coloca uma parte (com a sua bbox) dentro de uma caixa, escalada para a altura pedida. */
function place(part, x, y, height) {
  const s = height / part.h;
  return { s, w: part.w * s, g: (markup) => `<g transform="translate(${n(x - part.x * s)} ${n(y - part.y * s)}) scale(${+s.toFixed(5)})">${markup}</g>` };
}

const { symbol, wordmark, all, markOnly } = parts;
const files = {};
const pad = symbol.h * 0.07;

// 2. Logótipo horizontal: a composição do ficheiro de origem.
for (const [name, v] of [['logo-horizontal', VARIANTS.light], ['logo-horizontal-dark', VARIANTS.dark]]) {
  const body = recolor(symbol.markup, v) + recolor(wordmark.markup, v);
  files[`public/brand/${name}.svg`] = svgDoc([all.x - pad, all.y - pad, all.w + 2 * pad, all.h + 2 * pad], clean(body), { height: 120 });
}

// 3. Logótipo vertical: símbolo maior por cima, nome centrado por baixo.
{
  const symH = symbol.h * 1.65;
  const sym = place(symbol, 0, 0, symH);
  const textScale = 1;
  const tw = wordmark.w * textScale;
  const gap = symbol.h * 0.22;
  const W = Math.max(sym.w, tw);
  const symP = place(symbol, (W - sym.w) / 2, 0, symH);
  const txtP = place(wordmark, (W - tw) / 2, symH + gap, wordmark.h * textScale);
  const H = symH + gap + wordmark.h;
  for (const [name, v] of [['logo-vertical', VARIANTS.light], ['logo-vertical-dark', VARIANTS.dark]]) {
    const body = symP.g(recolor(symbol.markup, v)) + txtP.g(recolor(wordmark.markup, v));
    files[`public/brand/${name}.svg`] = svgDoc([-pad, -pad, W + 2 * pad, H + 2 * pad], clean(body), { height: 120 });
  }
}

// 4. Símbolo isolado e forma principal (marca de água).
const symBox = [symbol.x, symbol.y, symbol.w, symbol.h];
files['public/brand/symbol.svg'] = svgDoc(symBox, clean(recolor(symbol.markup, VARIANTS.light)), { height: 256 });
files['public/brand/symbol-dark.svg'] = svgDoc(symBox, clean(recolor(symbol.markup, VARIANTS.dark)), { height: 256 });
// Mesma caixa do símbolo, para a marca de água ficar com a proporção e o enquadramento do símbolo.
files['public/brand/mark.svg'] = svgDoc(symBox, clean(recolor(markOnly.markup, {}, { forceCurrentColor: true })));

// 5. Ícones: símbolo branco sobre o verde da marca.
function icon(shape, ratio) {
  const S = 512;
  // O símbolo cabe num quadrado de S*ratio, centrado.
  const scale = (S * ratio) / Math.max(symbol.w, symbol.h);
  const w = symbol.w * scale;
  const h = symbol.h * scale;
  const p = place(symbol, (S - w) / 2, (S - h) / 2, h);
  return svgDoc([0, 0, S, S], shape + clean(p.g(recolor(symbol.markup, VARIANTS.onBrand))));
}
files['public/brand/icon-app.svg'] = icon(`<rect width="512" height="512" rx="113" fill="${C.green}"/>`, 0.62);
files['public/brand/icon-profile.svg'] = icon(`<circle cx="256" cy="256" r="256" fill="${C.green}"/>`, 0.56);
files['public/favicon.svg'] = icon(`<rect width="512" height="512" rx="102" fill="${C.green}"/>`, 0.74);
// Ícone "maskable" (Android): fundo a toda a área e símbolo dentro da zona segura (círculo de 80%).
const maskable = icon(`<rect width="512" height="512" fill="${C.green}"/>`, 0.5);

for (const [path, content] of Object.entries(files)) {
  await writeFile(root + path, content);
  console.log('ok', path);
}

// 6. PNG.
async function rasterize(svg, out, size) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<html><body style="margin:0;background:transparent">${svg.replace('<svg ', `<svg style="display:block;width:${size}px;height:${size}px" `)}</body></html>`,
  );
  await page.screenshot({ path: root + out, omitBackground: true });
  console.log('ok', out);
}
await rasterize(files['public/favicon.svg'], 'public/favicon-32.png', 32);
await rasterize(files['public/brand/icon-app.svg'], 'public/apple-touch-icon.png', 180);
await rasterize(files['public/brand/icon-app.svg'], 'public/icon-192.png', 192);
await rasterize(files['public/brand/icon-app.svg'], 'public/icon-512.png', 512);
await rasterize(maskable, 'public/icon-maskable-512.png', 512);

// 7. Imagem de partilha (Open Graph), 1200x630: logótipo, título da página inicial e marca de água.
{
  const home = JSON.parse(await readFile(root + 'src/content/home.json', 'utf8'));
  const esc = (s) => String(s).replaceAll('{marca}', BRAND_NAME).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
  const font = (await readFile(root + 'node_modules/@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2')).toString('base64');
  const fontInter = (await readFile(root + 'node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2')).toString('base64');
  const html = `<!doctype html><html><head><style>
    @font-face { font-family: Manrope; src: url(data:font/woff2;base64,${font}) format('woff2'); font-weight: 200 800; }
    @font-face { font-family: Inter; src: url(data:font/woff2;base64,${fontInter}) format('woff2'); font-weight: 100 900; }
    html, body { margin: 0; }
    .og { position: relative; width: 1200px; height: 630px; overflow: hidden; background: ${C.ink}; color: ${C.white};
      box-sizing: border-box; padding: 72px 80px; display: flex; flex-direction: column; justify-content: space-between; }
    .wm { position: absolute; right: -90px; bottom: -120px; height: 640px; color: ${C.aqua}; opacity: .09; }
    .wm svg { height: 100%; width: auto; display: block; }
    .logo svg { height: 64px; width: auto; display: block; }
    h1 { font: 800 60px/1.08 Manrope, sans-serif; letter-spacing: -0.02em; margin: 0; max-width: 940px; position: relative; }
    h1 span { color: ${C.aqua}; }
    p { font: 500 26px/1.4 Inter, sans-serif; color: ${C.onInk}; margin: 0; position: relative; }
  </style></head><body><div class="og">
    <div class="wm">${files['public/brand/mark.svg']}</div>
    <div class="logo">${files['public/brand/logo-horizontal-dark.svg']}</div>
    <h1>${esc(home.hero.title)} <span>${esc(home.hero.titleAccent)}</span></h1>
    <p>Software, websites e apps à medida · ${LOCALITY.city}</p>
  </div></body></html>`;
  await mkdir(root + 'public/og', { recursive: true });
  await page.setViewportSize({ width: 1200, height: 630 });
  await page.setContent(html);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: root + 'public/og/default.png', clip: { x: 0, y: 0, width: 1200, height: 630 } });
  console.log('ok public/og/default.png');
}

await browser.close();

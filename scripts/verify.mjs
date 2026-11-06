// Verificação multi-browser e multi-largura, a partir do build em dist/.
//   npm run build && npm run verify
// Precisa de: npx playwright install chromium firefox webkit
//
// Motores: Chromium (Chrome, Edge, Android), WebKit (Safari macOS/iOS), Firefox.
// Para cada combinação mede:
//   - scroll horizontal (nada pode sair da largura do ecrã)
//   - áreas de toque < 44 × 44 px (exceto links dentro de texto corrido, exceção WCAG 2.5.8)
//   - campos de formulário com letra < 16 px (zoom automático no iOS)
//   - erros de JavaScript na consola (inclui violações da Content-Security-Policy)
//   - cabeçalhos de segurança e meta tags de SEO em cada página; robots.txt, sitemap e manifest
// Capturas de página inteira em screenshots/<motor>/.
import { chromium, firefox, webkit, devices } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';

const PAGES = (process.env.PAGES || '/,/privacidade,/404,/contacto/obrigado,/contacto/erro').split(',');
const SHOTS = process.env.SHOTS !== '0';
const port = 4329;

const widths = [
  ['320', { width: 320, height: 568 }],
  ['375', { width: 375, height: 812 }],
  ['768', { width: 768, height: 1024 }],
  ['1024', { width: 1024, height: 768 }],
  ['1280', { width: 1280, height: 800 }],
  ['1440', { width: 1440, height: 900 }],
  ['1920', { width: 1920, height: 1080 }],
  ['telemovel-horizontal', { width: 812, height: 375 }],
];
// Perfis com toque e user agent móvel reais (Firefox não suporta emulação móvel).
const deviceProfiles = [
  ['webkit', 'iphone-se', devices['iPhone SE']],
  ['webkit', 'iphone-15', devices['iPhone 15']],
  ['webkit', 'iphone-15-horizontal', devices['iPhone 15 landscape']],
  ['webkit', 'ipad-mini', devices['iPad Mini']],
  ['webkit', 'ipad-mini-horizontal', devices['iPad Mini landscape']],
  ['chromium', 'pixel-7', devices['Pixel 7']],
  ['chromium', 'pixel-7-horizontal', devices['Pixel 7 landscape']],
];
const engines = { chromium, webkit, firefox };
const skipped = new Set();

// Servidor do build (no Astro 7 o preview fica em segundo plano: parar no fim).
spawn('npx', ['astro', 'preview', 'stop'], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 800));
const server = spawn('npx', ['astro', 'preview', '--port', String(port)], { stdio: 'ignore' });
for (let i = 0; i < 60; i++) {
  try { if ((await fetch(`http://localhost:${port}/`)).ok) break; } catch {}
  await new Promise((r) => setTimeout(r, 500));
}

/** Corre dentro da página: devolve os problemas encontrados. */
function audit() {
  const issues = [];
  const vw = window.innerWidth;
  const sw = document.documentElement.scrollWidth;
  if (sw > vw) {
    const wide = [...document.querySelectorAll('body *')]
      .filter((el) => el.getBoundingClientRect().right > vw + 1 && getComputedStyle(el).position !== 'fixed')
      .slice(0, 3)
      .map((el) => el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ').slice(0, 2).join('.') : ''));
    issues.push(`scroll horizontal de ${sw - vw}px (${wide.join(', ')})`);
  }
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && !el.closest('[aria-hidden="true"]');
  };
  const inlineInText = (el) => getComputedStyle(el).display === 'inline' && /\S/.test((el.parentElement?.textContent || '').replace(el.textContent || '', ''));
  const targets = document.querySelectorAll('a[href], button, summary, input:not([type="hidden"]), textarea, select');
  for (const el of targets) {
    if (!visible(el) || inlineInText(el)) continue;
    if (el.matches('.sr-only, .sr-only *') && !el.matches(':focus')) continue;
    let r = el.getBoundingClientRect();
    if (el.matches('input[type="checkbox"], input[type="radio"]')) {
      const label = el.closest('label') || document.querySelector(`label[for="${el.id}"]`);
      if (label) r = label.getBoundingClientRect();
    }
    if (r.width < 44 || r.height < 44) {
      const name = (el.getAttribute('aria-label') || el.textContent || el.getAttribute('name') || el.tagName).trim().replace(/\s+/g, ' ').slice(0, 40);
      issues.push(`toque ${Math.round(r.width)}×${Math.round(r.height)}px: ${el.tagName.toLowerCase()} "${name}"`);
    }
  }
  for (const el of document.querySelectorAll('input, textarea, select')) {
    if (!visible(el)) continue;
    const fs = parseFloat(getComputedStyle(el).fontSize);
    if (fs < 16) issues.push(`campo com letra de ${fs}px (#${el.id})`);
  }
  return issues;
}

/** Passagem com movimento ativo: o ciclo do hero corre e pausa, e depois de percorrer a página nada fica escondido. */
async function runMotion(engineName, label, contextOptions) {
  if (skipped.has(engineName)) return;
  let browser;
  try { browser = await engines[engineName].launch(); } catch { skipped.add(engineName); return; }
  const context = await browser.newContext({ ...contextOptions, reducedMotion: 'no-preference' });
  const page = await context.newPage();
  const issues = [];
  page.on('pageerror', (e) => issues.push(`erro JS: ${e.message}`));
  await page.goto(`http://localhost:${port}/`, { waitUntil: 'networkidle' });
  // O ciclo só corre com o telemóvel visível (fora do ecrã fica em pausa para poupar bateria).
  await page.locator('.hero-phone').scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  const state = await page.evaluate(() => ({
    motion: document.documentElement.classList.contains('motion'),
    running: [...document.querySelectorAll('.mk-scene')].every((el) => el.getAnimations().some((a) => a.playState === 'running')),
  }));
  if (!state.motion) issues.push('classe .motion não foi ativada');
  if (!state.running) issues.push('o ciclo do hero não está a correr');
  const pause = page.locator('[data-hero-pause]');
  if (await pause.isVisible()) {
    await pause.click();
    const paused = await page.evaluate(() => [...document.querySelectorAll('.mk-scene')].every((el) => el.getAnimations().every((a) => a.playState === 'paused')));
    if (!paused) issues.push('o botão de pausa não parou a animação');
    if ((await pause.getAttribute('aria-pressed')) !== 'true') issues.push('pausa: aria-pressed não mudou');
    await pause.click();
  } else issues.push('botão de pausa invisível');
  // Percorre a página como um utilizador.
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  const step = Math.round((contextOptions.viewport?.height || 800) * 0.6);
  for (let y = 0; y <= height; y += step) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await page.waitForTimeout(120);
  }
  await page.waitForTimeout(1300);
  const after = await page.evaluate(() => ({
    hidden: [...document.querySelectorAll('.reveal')].filter((el) => !el.classList.contains('in') || parseFloat(getComputedStyle(el).opacity) < 0.99).length,
    flowDone: document.querySelector('[data-flow]')?.classList.contains('done'),
    problems: [...document.querySelectorAll('[data-problem] .pb-check')].filter((el) => parseFloat(getComputedStyle(el).opacity) < 0.99).length,
    offscreen: document.querySelector('.hero-stage')?.classList.contains('is-offscreen'),
  }));
  if (after.hidden) issues.push(`${after.hidden} elementos continuam escondidos depois do scroll`);
  if (!after.flowDone) issues.push('a linha do método não chegou ao fim');
  if (after.problems) issues.push(`${after.problems} cartões de problemas sem o ✓`);
  if (!after.offscreen) issues.push('o hero não pausou fora do ecrã');
  report.push({ engine: engineName, label: `${label} (movimento)`, path: '/', issues });
  console.log(`${issues.length ? '✗' : '✓'} ${engineName.padEnd(8)} ${(label + ' movimento').padEnd(22)} /${issues.length ? '\n    - ' + issues.join('\n    - ') : ''}`);
  await browser.close();
}

/** Formulário de contacto no browser: erros acessíveis, Turnstile (chave de teste) e envio (simulado). */
async function runForm(engineName, label, contextOptions) {
  if (skipped.has(engineName)) return;
  let browser;
  try { browser = await engines[engineName].launch(); } catch { skipped.add(engineName); return; }
  const context = await browser.newContext({ ...contextOptions, reducedMotion: 'reduce' });
  const page = await context.newPage();
  const issues = [];
  page.on('pageerror', (e) => issues.push(`erro JS: ${e.message}`));
  page.on('console', (m) => /Content Security Policy|Content-Security-Policy/i.test(m.text()) && issues.push(`CSP: ${m.text().slice(0, 200)}`));
  // Cada teste usa um "IP" próprio, para não esbarrar no limite de 5 pedidos por minuto.
  const ip = `10.9.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`;
  await page.route('**/api/contact', (route) => route.continue({ headers: { ...route.request().headers(), 'cf-connecting-ip': ip } }));
  await page.goto(`http://localhost:${port}/#contacto`, { waitUntil: 'networkidle' });
  const form = page.locator('[data-contact-form]');
  await form.scrollIntoViewIfNeeded();
  await page.locator('[data-submit]').click();
  const empty = await page.evaluate(() => ({
    invalid: document.querySelectorAll('[data-contact-form] [aria-invalid="true"]').length,
    shown: [...document.querySelectorAll('[data-error-for]')].filter((p) => !p.classList.contains('hidden')).length,
    focus: document.activeElement?.id,
  }));
  if (empty.invalid < 5 || empty.shown < 5) issues.push(`envio vazio: ${empty.invalid} campos marcados, ${empty.shown} mensagens (esperado 5)`);
  if (empty.focus !== 'c-nome') issues.push(`envio vazio: o foco foi para "${empty.focus}" em vez do primeiro campo`);
  await page.fill('#c-nome', 'Ana Teste');
  await page.fill('#c-negocio', 'Negócio de Teste');
  await page.fill('#c-telemovel', '912 345 678');
  await page.fill('#c-mensagem', 'Mensagem automática de verificação do formulário.');
  await page.check('#c-consentimento');
  try {
    await page.waitForFunction(() => !!document.querySelector('[name="cf-turnstile-response"]')?.value, null, { timeout: 15000 });
  } catch { issues.push('o Turnstile não devolveu token em 15 s'); }
  await page.locator('[data-submit]').click();
  try {
    await page.locator('[data-form-success]').waitFor({ state: 'visible', timeout: 10000 });
    const focused = await page.evaluate(() => document.activeElement?.hasAttribute('data-form-success'));
    if (!focused) issues.push('a confirmação apareceu mas não recebeu o foco');
  } catch {
    const msg = await page.locator('[data-form-error]').textContent().catch(() => '');
    issues.push(`envio válido sem confirmação${msg ? `: "${msg.trim()}"` : ''}`);
  }
  report.push({ engine: engineName, label: `${label} (formulário)`, path: '/#contacto', issues });
  console.log(`${issues.length ? '✗' : '✓'} ${engineName.padEnd(8)} ${(label + ' formulário').padEnd(22)} /#contacto${issues.length ? '\n    - ' + issues.join('\n    - ') : ''}`);
  await browser.close();
}

/** Corre dentro da página: meta tags essenciais de SEO e partilha. */
function seoAudit() {
  const issues = [];
  const need = {
    title: document.title,
    description: document.querySelector('meta[name="description"]')?.getAttribute('content'),
    canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href'),
    'og:title': document.querySelector('meta[property="og:title"]')?.getAttribute('content'),
    'og:image': document.querySelector('meta[property="og:image"]')?.getAttribute('content'),
    'twitter:card': document.querySelector('meta[name="twitter:card"]')?.getAttribute('content'),
  };
  for (const [k, v] of Object.entries(need)) if (!v) issues.push(`SEO: falta ${k}`);
  if (document.documentElement.lang !== 'pt-PT') issues.push('SEO: <html lang> não é pt-PT');
  if (document.querySelectorAll('h1').length !== 1) issues.push(`SEO: ${document.querySelectorAll('h1').length} elementos h1 (esperado 1)`);
  for (const s of document.querySelectorAll('script[type="application/ld+json"]')) {
    try { JSON.parse(s.textContent ?? ''); } catch { issues.push('SEO: JSON-LD inválido'); }
  }
  return issues;
}

/** Ficheiros de SEO servidos pelo build. */
async function checkSeoFiles() {
  const issues = [];
  const get = async (path) => {
    const r = await fetch(`http://localhost:${port}${path}`);
    if (!r.ok) issues.push(`${path}: HTTP ${r.status}`);
    return r.ok ? r.text() : '';
  };
  const robots = await get('/robots.txt');
  if (!/Sitemap: https?:\/\/\S+\/sitemap-index\.xml/.test(robots)) issues.push('robots.txt sem a linha Sitemap');
  const sitemap = await get('/sitemap-0.xml');
  if (/contacto\//.test(sitemap)) issues.push('sitemap inclui as páginas /contacto/ (devem ficar de fora)');
  if (!/<loc>[^<]+<\/loc>/.test(sitemap)) issues.push('sitemap sem URLs');
  try { JSON.parse(await get('/site.webmanifest')); } catch { issues.push('site.webmanifest não é JSON válido'); }
  const og = await fetch(`http://localhost:${port}/og/default.png`);
  if (!og.ok || !(og.headers.get('content-type') ?? '').includes('image/png')) issues.push('/og/default.png em falta');
  report.push({ engine: 'http', label: 'ficheiros SEO', path: '/robots.txt, /sitemap, /site.webmanifest, /og', issues });
  console.log(`${issues.length ? '✗' : '✓'} http     ficheiros SEO${issues.length ? '\n    - ' + issues.join('\n    - ') : ''}`);
}

const report = [];
async function run(engineName, label, contextOptions) {
  if (skipped.has(engineName)) return;
  let browser;
  try {
    browser = await engines[engineName].launch();
  } catch (e) {
    skipped.add(engineName);
    console.log(`! ${engineName}: não foi possível arrancar o browser (${String(e.message).split('\n')[0]}). Correr este script num terminal normal.`);
    return;
  }
  const context = await browser.newContext({ ...contextOptions, reducedMotion: 'reduce' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  for (const path of PAGES) {
    const response = await page.goto(`http://localhost:${port}${path}`, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    const issues = await page.evaluate(audit);
    const headers = response?.headers() ?? {};
    for (const h of ['content-security-policy', 'strict-transport-security', 'x-content-type-options', 'referrer-policy']) {
      if (!headers[h]) issues.push(`cabeçalho em falta: ${h}`);
    }
    issues.push(...(await page.evaluate(seoAudit)));
    // Menu do telemóvel: abre, mede, fecha (onde o botão estiver visível).
    const toggle = page.locator('[data-menu-toggle]');
    if (await toggle.isVisible()) {
      await toggle.click();
      const menuIssues = (await page.evaluate(audit)).filter((i) => i.startsWith('toque') || i.startsWith('scroll'));
      issues.push(...menuIssues.map((i) => `menu aberto: ${i}`));
      if ((await toggle.getAttribute('aria-expanded')) !== 'true') issues.push('menu: aria-expanded não mudou');
      await page.keyboard.press('Escape');
    }
    const slug = path === '/' ? 'inicio' : path.replace(/\W+/g, '');
    if (SHOTS) {
      await mkdir(`screenshots/${engineName}`, { recursive: true });
      await page.screenshot({ path: `screenshots/${engineName}/${slug}-${label}.png`, fullPage: true });
    }
    const all = [...new Set([...issues, ...errors.map((e) => `erro JS: ${e}`)])];
    report.push({ engine: engineName, label, path, issues: all });
    console.log(`${all.length ? '✗' : '✓'} ${engineName.padEnd(8)} ${label.padEnd(22)} ${path}${all.length ? '\n    - ' + all.join('\n    - ') : ''}`);
    errors.length = 0;
  }
  await browser.close();
}

try {
  await checkSeoFiles();
  for (const engineName of Object.keys(engines)) {
    for (const [label, viewport] of widths) await run(engineName, label, { viewport });
  }
  for (const [engineName, label, profile] of deviceProfiles) await run(engineName, label, profile);
  for (const engineName of Object.keys(engines)) {
    await runMotion(engineName, '375', { viewport: { width: 375, height: 812 } });
    await runMotion(engineName, '1280', { viewport: { width: 1280, height: 800 } });
  }
  await runMotion('webkit', 'iphone-15', devices['iPhone 15']);
  for (const engineName of Object.keys(engines)) await runForm(engineName, '1280', { viewport: { width: 1280, height: 800 } });
  await runForm('webkit', 'iphone-15', devices['iPhone 15']);
  await runForm('chromium', 'pixel-7', devices['Pixel 7']);
} finally {
  server.kill();
  spawn('npx', ['astro', 'preview', 'stop'], { stdio: 'ignore' });
}

const failed = report.filter((r) => r.issues.length);
await mkdir('screenshots', { recursive: true });
await writeFile('screenshots/relatorio.json', JSON.stringify(report, null, 2));
console.log(`\n${report.length - failed.length}/${report.length} combinações sem problemas.`);
if (skipped.size) console.log(`Não executados: ${[...skipped].join(', ')}.`);
process.exitCode = failed.length || skipped.size ? 1 : 0;

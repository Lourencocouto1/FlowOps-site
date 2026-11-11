// Relatório Lighthouse (telemóvel e computador) a partir do build em .vercel/output/ (servidor local em scripts/serve-vercel.mjs).
//   npm run build && npm run lighthouse
// Usa o Chromium do Playwright. Guarda os relatórios em docs/lighthouse/ (HTML para abrir no browser, JSON para comparar).
// Telemóvel: as condições por defeito do Lighthouse (ecrã de telemóvel, rede 4G lenta e CPU 4x mais lento, simulados).
// Cada página corre RUNS vezes (por defeito 3) e conta a mediana da performance, como recomenda o Lighthouse.
// Antes, uma corrida de aquecimento: a 1.ª página num Chrome acabado de abrir inclui o arranque do próprio browser.
import { chromium } from '@playwright/test';
import { serveVercel } from './serve-vercel.mjs';
import { mkdir, writeFile } from 'node:fs/promises';
import lighthouse from 'lighthouse';
import desktopConfig from 'lighthouse/core/config/desktop-config.js';
import * as chromeLauncher from 'chrome-launcher';

const PAGES = (process.env.PAGES || '/,/privacidade,/termos').split(',');
const MIN = Number(process.env.MIN_SCORE || 95);
const port = 4330;
const RUNS = Number(process.env.RUNS || 3);
const out = 'docs/lighthouse';
const categories = ['performance', 'accessibility', 'best-practices', 'seo'];

const server = await serveVercel(port);

const chrome = await chromeLauncher.launch({ chromePath: chromium.executablePath(), chromeFlags: ['--headless=new'] });
const rows = [];
let failed = false;
try {
  await mkdir(out, { recursive: true });
  const flags = { port: chrome.port, output: ['html', 'json'], onlyCategories: categories, logLevel: 'error', locale: 'pt-PT' };
  await lighthouse(`http://localhost:${port}/`, flags); // aquecimento (descartado)
  for (const [mode, config] of [['telemovel', undefined], ['computador', desktopConfig]]) {
    for (const path of PAGES) {
      const runs = [];
      for (let i = 0; i < RUNS; i++) {
        const r = await lighthouse(`http://localhost:${port}${path}`, flags, config);
        if (!r) throw new Error(`Lighthouse sem resultado para ${path}`);
        runs.push(r);
      }
      runs.sort((a, b) => (a.lhr.categories.performance.score ?? 0) - (b.lhr.categories.performance.score ?? 0));
      const result = runs[Math.floor(runs.length / 2)];
      const perfRuns = runs.map((r) => Math.round((r.lhr.categories.performance.score ?? 0) * 100)).join('/');
      const slug = `${mode}-${path === '/' ? 'inicio' : path.replace(/\W+/g, '')}`;
      const [html, json] = /** @type {string[]} */ (result.report);
      await writeFile(`${out}/${slug}.html`, html);
      await writeFile(`${out}/${slug}.json`, json);
      const lhr = result.lhr;
      const scores = Object.fromEntries(categories.map((c) => [c, Math.round((lhr.categories[c].score ?? 0) * 100)]));
      const m = (id) => lhr.audits[id]?.displayValue ?? '';
      rows.push({ mode, path, ...scores, runs: perfRuns, LCP: m('largest-contentful-paint'), CLS: m('cumulative-layout-shift'), TBT: m('total-blocking-time') });
      if (Object.values(scores).some((s) => s < MIN)) {
        failed = true;
        for (const c of categories) {
          if (scores[c] >= MIN) continue;
          const bad = lhr.categories[c].auditRefs
            .map((r) => lhr.audits[r.id])
            .filter((a) => a.score !== null && a.score < 0.9 && a.scoreDisplayMode !== 'informative')
            .map((a) => `${a.id}: ${a.title}${a.displayValue ? ` (${a.displayValue})` : ''}`);
          console.log(`  ${mode} ${path} ${c} ${scores[c]}:\n    - ${bad.join('\n    - ')}`);
        }
      }
    }
  }
} finally {
  chrome.kill();
  server.close();
}

console.table(rows);
const md = [
  '| Modo | Página | Performance (mediana) | Corridas | Acessibilidade | Boas práticas | SEO | LCP | CLS | TBT |',
  '| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
  ...rows.map((r) => `| ${r.mode} | ${r.path} | ${r.performance} | ${r.runs} | ${r.accessibility} | ${r['best-practices']} | ${r.seo} | ${r.LCP} | ${r.CLS} | ${r.TBT} |`),
].join('\n');
await writeFile(`${out}/resumo.md`, `# Lighthouse ${new Date().toISOString().slice(0, 10)}\n\nBuild local (scripts/serve-vercel.mjs, sem compressão: em produção a Vercel comprime o HTML e o CSS). ${RUNS} corridas por página, conta a mediana da performance. Mínimo pedido: ${MIN}.\n\n${md}\n`);
console.log(`\nRelatórios em ${out}/. ${failed ? `Há categorias abaixo de ${MIN}.` : `Todas as categorias ≥ ${MIN}.`}`);
process.exitCode = failed ? 1 : 0;

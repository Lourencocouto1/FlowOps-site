// @ts-check
// Integração local: no fim do build junta os cabeçalhos de segurança a .vercel/output/config.json.
// A Content-Security-Policy é calculada a partir do HTML gerado: cada <script> inline recebe o seu hash
// sha256, por isso a política fica sempre certa sem ser preciso mantê-la à mão.
// Os cabeçalhos são aplicados pela Vercel (rotas da Build Output API) a todas as respostas.
// A resposta do /api/contact define os seus próprios cabeçalhos no código.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const TURNSTILE = 'https://challenges.cloudflare.com';
const EXECUTABLE = /^(|module|text\/javascript|application\/javascript)$/i;

/** @param {string} dir */
async function htmlFiles(dir) {
  /** @type {string[]} */
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await htmlFiles(p)));
    else if (entry.name.endsWith('.html')) out.push(p);
  }
  return out;
}

/**
 * @param {{ analyticsSrc?: string, analyticsHost?: string, hsts?: string }} [options]
 * @returns {import('astro').AstroIntegration}
 */
export default function securityHeaders(options = {}) {
  /** @type {URL} */
  let projectRoot;
  return {
    name: 'flowops:security-headers',
    hooks: {
      'astro:config:done': ({ config }) => {
        projectRoot = config.root;
      },
      'astro:build:done': async ({ dir, logger }) => {
        const root = fileURLToPath(dir);
        const files = await htmlFiles(root);
        if (!files.length) throw new Error(`security-headers: não encontrei HTML em ${root}`);

        const hashes = new Set();
        for (const file of files) {
          const html = await readFile(file, 'utf8');
          for (const m of html.matchAll(/<script(\s[^>]*)?>([\s\S]*?)<\/script>/gi)) {
            const attrs = m[1] ?? '';
            if (/\ssrc=/i.test(attrs)) continue;
            const type = /\stype=["']?([^"'\s>]+)/i.exec(attrs)?.[1] ?? '';
            if (!EXECUTABLE.test(type)) continue; // ex.: application/ld+json não é executado
            hashes.add(`'sha256-${createHash('sha256').update(m[2]).digest('base64')}'`);
          }
          // Atributos de evento (onclick=...) seriam bloqueados pela CSP: falhar o build em vez de partir em produção.
          const handler = /<[a-z][^>]*\son[a-z]+\s*=/i.exec(html.replace(/<script[\s\S]*?<\/script>/gi, ''));
          if (handler) throw new Error(`security-headers: atributo de evento inline em ${file}: ${handler[0].slice(0, 80)}`);
        }

        const analytics = [options.analyticsSrc, options.analyticsHost]
          .filter(Boolean)
          .map((u) => new URL(/** @type {string} */ (u)).origin);
        const uniq = (/** @type {string[]} */ a) => [...new Set(a)].join(' ');

        const csp = [
          "default-src 'self'",
          `script-src ${uniq(["'self'", ...hashes, TURNSTILE, ...analytics])}`,
          // Estilos inline: Astro e o Turnstile usam-nos; não executam código.
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data:",
          "font-src 'self'",
          `connect-src ${uniq(["'self'", ...analytics])}`,
          `frame-src ${TURNSTILE}`,
          "frame-ancestors 'none'",
          "form-action 'self'",
          "base-uri 'self'",
          "object-src 'none'",
          // Sem upgrade-insecure-requests: o site já é só HTTPS (HSTS) e, em localhost, o Safari
          // tentaria HTTPS e partiria a pré-visualização.
        ].join('; ');

        const all = [
          `Content-Security-Policy: ${csp}`,
          `Strict-Transport-Security: ${options.hsts ?? 'max-age=31536000; includeSubDomains'}`,
          'X-Content-Type-Options: nosniff',
          'X-Frame-Options: DENY',
          'Referrer-Policy: strict-origin-when-cross-origin',
          'Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()',
          'Cross-Origin-Opener-Policy: same-origin',
        ];
        const toObj = (/** @type {string[]} */ lines) =>
          Object.fromEntries(lines.map((l) => [l.slice(0, l.indexOf(':')), l.slice(l.indexOf(':') + 1).trim()]));
        // Regras na Build Output API da Vercel (.vercel/output/config.json), antes das rotas do adaptador.
        // "continue: true" aplica os cabeçalhos e segue para a rota seguinte (ficheiro estático ou função).
        const rules = [
          { src: '/(.*)', headers: toObj(all), continue: true },
          // /_astro/* (ficheiros com hash no nome) já recebe cache longa do adaptador.
          { src: '/brand/(.*)', headers: { 'Cache-Control': 'public, max-age=86400' }, continue: true },
          { src: '/og/(.*)', headers: { 'Cache-Control': 'public, max-age=86400' }, continue: true },
        ];

        // O adaptador da Vercel corre antes (vem primeiro nas integrações) e já escreveu o config.json.
        const configPath = fileURLToPath(new URL('.vercel/output/config.json', projectRoot));
        if (!existsSync(configPath)) throw new Error(`security-headers: não encontrei ${configPath} (o adaptador é o da Vercel?)`);
        const config = JSON.parse(readFileSync(configPath, 'utf8'));
        config.routes = [...rules, ...(config.routes ?? [])];
        writeFileSync(configPath, JSON.stringify(config, null, 2));
        logger.info(`Cabeçalhos escritos: ${files.length} páginas, ${hashes.size} script(s) inline com hash.`);
      },
    },
  };
}

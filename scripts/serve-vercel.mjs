// Servidor local que imita a Vercel a partir de .vercel/output/ (o adaptador da Vercel não suporta `astro preview`).
//   npm run build && npm run serve        (porta 4321; outra: PORT=4400 npm run serve)
// Aplica as rotas de .vercel/output/config.json pela ordem (cabeçalhos com "continue", redirecionamentos,
// "handle: filesystem", destino de função ou 404) e corre a função do /api/contact com as variáveis do .env.
// Usado por scripts/verify.mjs e scripts/lighthouse.mjs. Não é um servidor de produção.
import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { pathToFileURL } from 'node:url';
import { Readable } from 'node:stream';
import { loadEnv } from 'vite';

const OUT = '.vercel/output';
const STATIC = join(OUT, 'static');
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.webp': 'image/webp', '.avif': 'image/avif', '.ico': 'image/x-icon', '.woff2': 'font/woff2',
  '.mp4': 'video/mp4', '.webm': 'video/webm',
};

/** Arranca o servidor e devolve-o (para fechar com server.close()). */
export async function serveVercel(port = 4321) {
  const { routes } = JSON.parse(readFileSync(join(OUT, 'config.json'), 'utf8'));
  // A função lê process.env em tempo de execução, como na Vercel.
  Object.assign(process.env, loadEnv('production', process.cwd(), ''), { ...process.env });
  const fns = new Map();
  const fn = async (name) => {
    if (!fns.has(name)) {
      const dir = join(OUT, 'functions', `${name}.func`);
      const { handler } = JSON.parse(readFileSync(join(dir, '.vc-config.json'), 'utf8'));
      fns.set(name, (await import(pathToFileURL(join(dir, handler)).href)).default);
    }
    return fns.get(name);
  };
  const file = (pathname) => {
    const base = normalize(join(STATIC, decodeURIComponent(pathname)));
    if (!base.startsWith(normalize(STATIC))) return null;
    for (const p of [base, `${base}.html`, join(base, 'index.html')]) {
      if (existsSync(p) && statSync(p).isFile()) return p;
    }
    return null;
  };

  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, `http://localhost:${port}`);
      const headers = {};
      let status = 200;
      let target = null; // { file } | { fn }
      let afterFs = false;
      for (const r of routes) {
        if (r.handle === 'filesystem') {
          afterFs = true;
          const f = file(url.pathname);
          if (f) { target = { file: f }; break; }
          continue;
        }
        const m = new RegExp(r.src).exec(url.pathname);
        if (!m) continue;
        const sub = (v) => v.replace(/\$(\d+)/g, (_, i) => m[Number(i)] ?? '');
        for (const [k, v] of Object.entries(r.headers ?? {})) headers[k.toLowerCase()] = sub(v);
        if (r.status) status = r.status;
        if (r.status >= 300 && r.status < 400) { res.writeHead(status, headers).end(); return; }
        if (r.continue) continue;
        if (r.dest) {
          const dest = sub(r.dest);
          target = dest.startsWith('/') ? { file: file(dest) } : { fn: dest };
          break;
        }
      }
      if (!afterFs || !target) { res.writeHead(404, headers).end('Not Found'); return; }

      if (target.file) {
        const type = TYPES[extname(target.file)] ?? 'application/octet-stream';
        res.writeHead(status, { 'content-type': type, ...headers });
        if (req.method === 'HEAD') return res.end();
        return res.end(readFileSync(target.file));
      }
      const handler = await fn(target.fn);
      const body = req.method === 'GET' || req.method === 'HEAD' ? undefined : Readable.toWeb(req);
      const reqHeaders = new Headers();
      for (const [k, v] of Object.entries(req.headers)) if (typeof v === 'string') reqHeaders.set(k, v);
      // Na Vercel o x-forwarded-for é definido pela plataforma.
      reqHeaders.set('x-forwarded-for', req.socket.remoteAddress?.replace(/^::ffff:/, '') ?? '127.0.0.1');
      const response = await handler.fetch(new Request(url, { method: req.method, headers: reqHeaders, body, duplex: 'half' }));
      const out = { ...headers };
      response.headers.forEach((v, k) => { out[k] = v; });
      res.writeHead(response.status, out);
      res.end(Buffer.from(await response.arrayBuffer()));
    } catch (err) {
      console.error(err);
      res.writeHead(500).end('Erro no servidor local');
    }
  });
  await new Promise((resolve) => server.listen(port, resolve));
  return server;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT || 4321);
  await serveVercel(port);
  console.log(`Build da Vercel em http://localhost:${port}/ (Ctrl+C para parar)`);
}

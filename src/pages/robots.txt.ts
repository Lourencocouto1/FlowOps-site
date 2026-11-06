// /robots.txt, com o endereço do sitemap a partir da URL canónica (site.config.mjs).
import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) =>
  new Response(
    ['User-agent: *', 'Allow: /', 'Disallow: /api/', '', `Sitemap: ${new URL('/sitemap-index.xml', site).href}`, ''].join('\n'),
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );

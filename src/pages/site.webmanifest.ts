// /site.webmanifest: nome e ícones para "Adicionar ao ecrã principal".
import type { APIRoute } from 'astro';
import { brand } from '../lib/site';

export const GET: APIRoute = () =>
  Response.json(
    {
      name: brand.name,
      short_name: brand.name,
      lang: 'pt-PT',
      start_url: '/',
      display: 'browser',
      background_color: '#0F1F1C',
      theme_color: '#0F1F1C',
      icons: [
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    { headers: { 'Content-Type': 'application/manifest+json' } },
  );

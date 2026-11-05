// @ts-check
import { defineConfig, envField } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// Domínio final: [A CONFIRMAR: flowops.pt]. Pode ser sobreposto com PUBLIC_SITE_URL.
const site = process.env.PUBLIC_SITE_URL || 'https://flowops.pt';

export default defineConfig({
  site,
  trailingSlash: 'never',
  build: { format: 'file' },
  integrations: [sitemap()],
  vite: { plugins: [tailwindcss()] },
  env: {
    schema: {
      // Link da plataforma de marcações (projeto separado). Vazio: o botão "Marcar uma conversa" abre o WhatsApp.
      PUBLIC_BOOKING_URL: envField.string({ context: 'client', access: 'public', optional: true, url: true }),
      // Mostrar a secção de preços (escondida por defeito).
      PUBLIC_SHOW_PRICING: envField.boolean({ context: 'client', access: 'public', default: false }),
    },
  },
});

// @ts-check
import { defineConfig, envField } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import cloudflare from '@astrojs/cloudflare';

// Domínio final: [A CONFIRMAR: flowops.pt]. Pode ser sobreposto com PUBLIC_SITE_URL.
const site = process.env.PUBLIC_SITE_URL || 'https://flowops.pt';

export default defineConfig({
  site,
  trailingSlash: 'never',
  build: { format: 'file' },
  // Site estático; só /api/contact corre no servidor (Cloudflare Workers).
  adapter: cloudflare({ imageService: 'compile' }),
  integrations: [sitemap({ filter: (page) => !page.includes('/contacto/') })],
  vite: { plugins: [tailwindcss()] },
  env: {
    schema: {
      // Link da plataforma de marcações (projeto separado). Vazio: o botão "Marcar uma conversa" abre o WhatsApp.
      PUBLIC_BOOKING_URL: envField.string({ context: 'client', access: 'public', optional: true, url: true }),
      // Mostrar a secção de preços (escondida por defeito).
      PUBLIC_SHOW_PRICING: envField.boolean({ context: 'client', access: 'public', default: false }),
      // Cloudflare Turnstile (anti-spam). Chave pública do widget.
      PUBLIC_TURNSTILE_SITE_KEY: envField.string({ context: 'client', access: 'public', optional: true }),
      // Segredos do formulário de contacto (definidos no painel da Cloudflare, nunca no repositório).
      TURNSTILE_SECRET_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
      RESEND_API_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
      CONTACT_TO_EMAIL: envField.string({ context: 'server', access: 'secret', optional: true }),
      CONTACT_FROM_EMAIL: envField.string({ context: 'server', access: 'secret', optional: true }),
      // Envio simulado: valida tudo mas não envia o email (para testes).
      CONTACT_DRY_RUN: envField.boolean({ context: 'server', access: 'public', default: false }),
    },
  },
});

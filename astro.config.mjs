// @ts-check
import { defineConfig, envField } from 'astro/config';
import { loadEnv } from 'vite';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';
import securityHeaders from './integrations/security-headers.mjs';
import { siteUrl } from './site.config.mjs';

// Variáveis do .env (e do ambiente de build), para as opções que se decidem no build.
const env = { ...loadEnv(process.env.NODE_ENV ?? 'production', process.cwd(), ''), ...process.env };

export default defineConfig({
  // Nome, domínio e URL canónica: ver site.config.mjs.
  site: siteUrl(env.PUBLIC_SITE_URL),
  trailingSlash: 'never',
  build: { format: 'file' },
  // Site estático; só /api/contact corre no servidor (Vercel Functions).
  adapter: vercel(),
  integrations: [
    sitemap({ filter: (page) => !page.includes('/contacto/') }),
    securityHeaders({ analyticsSrc: env.PUBLIC_UMAMI_SRC, analyticsHost: env.PUBLIC_UMAMI_HOST }),
  ],
  vite: {
    plugins: [tailwindcss()],
    // Fontes sempre como ficheiros (nunca data: embutido): a CSP só permite fontes do próprio site.
    build: { assetsInlineLimit: (file) => (/\.(woff2?|ttf|otf)$/.test(file) ? false : undefined) },
  },
  env: {
    schema: {
      // Link da plataforma de marcações (projeto separado). Vazio: o botão "Marcar uma conversa" abre o WhatsApp.
      PUBLIC_BOOKING_URL: envField.string({ context: 'client', access: 'public', optional: true, url: true }),
      // Mostrar a secção de preços (escondida por defeito).
      PUBLIC_SHOW_PRICING: envField.boolean({ context: 'client', access: 'public', default: false }),
      // Cloudflare Turnstile (anti-spam). Chave pública do widget.
      PUBLIC_TURNSTILE_SITE_KEY: envField.string({ context: 'client', access: 'public', optional: true }),
      // Umami (estatísticas sem cookies). Vazio: o script não é carregado.
      PUBLIC_UMAMI_SRC: envField.string({ context: 'client', access: 'public', optional: true, url: true }),
      PUBLIC_UMAMI_WEBSITE_ID: envField.string({ context: 'client', access: 'public', optional: true }),
      // Só se o Umami enviar os dados para outro endereço que não o do script (data-host-url).
      PUBLIC_UMAMI_HOST: envField.string({ context: 'client', access: 'public', optional: true, url: true }),
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

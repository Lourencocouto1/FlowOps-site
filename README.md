# Website da FlowOps

Site institucional da FlowOps, marca comercial de Lourenço Couto e Pedro Marques (trabalhadores independentes): software, websites e apps à medida, em Lisboa.
Feito com [Astro](https://astro.build) 7, Tailwind CSS 4 e TypeScript. O site é estático; só o formulário de contacto (`/api/contact`) corre no servidor (Vercel Functions).

## Correr localmente

Precisa de Node.js 22.12 ou mais recente.

```bash
npm install
cp .env.example .env      # e preencher o que for preciso
npm run dev               # http://localhost:4321
```

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Gera o site em `dist/` |
| `npm run preview` | Serve o build localmente, como na Vercel (`scripts/serve-vercel.mjs`, porta 4321) |
| `npm run check` | Verifica tipos e conteúdos |
| `npm run brand` | Gera todos os ficheiros da marca (logótipos, favicon, ícones, imagem Open Graph) a partir de `public/brand/logo-source.svg` |
| `npm run verify` | Verificação em Chromium, WebKit (Safari) e Firefox: 320, 375, 768, 1024, 1280, 1440, 1920 px, telemóvel na horizontal, iPhone, iPad e Android. Mede scroll horizontal, áreas de toque < 44 px, campos < 16 px, erros de JavaScript e violações da CSP, cabeçalhos de segurança, meta tags de SEO, `robots.txt`, sitemap e manifest; faz uma passagem com movimento ativo e testa o formulário. Capturas em `screenshots/` (precisa de `npx playwright install chromium firefox webkit`) |
| `npm run lighthouse` | Lighthouse em telemóvel e computador (mediana de 3 corridas); relatórios em `docs/lighthouse/` |

`verify` e `lighthouse` usam o build: correr `npm run build` antes.

## Nome, domínio e titulares: `site.config.mjs`

O nome comercial, o domínio, a URL canónica, os titulares (nome e NIF) e a morada estão **só** em `site.config.mjs`. Títulos, Open Graph, schema.org, sitemap, `robots.txt`, manifest, rodapé, páginas legais e o email do formulário leem daí. Nos textos de `src/content/`, `{marca}` é substituído pelo nome.

Para mudar de nome ou de domínio:
1. Editar `site.config.mjs`.
2. `npm run brand` (a imagem Open Graph e os títulos dos SVG levam o nome). Se o nome mudar, o logótipo também muda: ver "Marca".
3. `npm run build`.
4. Fora do código: domínio no projeto da Vercel, hostnames do Turnstile, domínio no Resend e `CONTACT_FROM_EMAIL`, site no Umami (ver "Deploy").

## Onde editar cada conteúdo

Todos os textos estão em `src/content/`. Não é preciso mexer no código. Se um campo estiver mal preenchido, o `npm run build` ou o `npm run check` dizem qual é e porquê.

| Ficheiro | Conteúdo |
|---|---|
| `settings.json` | Contactos (WhatsApp, email), redes sociais, mensagem pré-preenchida do WhatsApp, descrição do site |
| `home.json` | Títulos e textos de cada secção da página inicial (hero, problemas, serviços, método, compromissos, exemplos, sobre nós, preços, FAQ, contacto) |
| `problems.json` | Os 4 cartões "Problema → solução" |
| `services.json` | Os 6 serviços |
| `steps.json` | Os 4 passos de "Como trabalhamos" |
| `commitments.json` | Os compromissos |
| `faq.json` | Perguntas frequentes |
| `founders.json` | Fundadores (nome, texto, foto) |
| `cases/*.md` | Projetos do portefólio, um ficheiro por projeto |

**Ordem:** cada item tem um campo `order`, e os itens aparecem do menor para o maior.

**WhatsApp:** em `settings.json`, coloque só os dígitos com o indicativo, por exemplo `351912345678`. Enquanto o campo estiver vazio, os botões levam à secção de contacto.

**Fotografias dos fundadores:** coloque os ficheiros em `src/assets/team/` e escreva o nome do ficheiro no campo `photo` de `founders.json`. Ficam aqui, e não em `public/images/team/`, para o Astro gerar automaticamente as versões AVIF e WebP em vários tamanhos.

**Casos reais:** copie `src/content/cases/_modelo-caso-real.md.txt` para um ficheiro `.md` novo. Use `isDemo: false` e preencha o resultado e o testemunho só com informação confirmada e autorizada pelo cliente. Os projetos de demonstração têm `isDemo: true` e aparecem identificados como "Projeto de demonstração".

**Secção de preços:** está escondida por defeito. Para a mostrar, defina `PUBLIC_SHOW_PRICING=true`. O texto da secção está em `home.json` → `pricing`.

## Configuração (`.env`)

| Variável | Para quê |
|---|---|
| `PUBLIC_SITE_URL` | Opcional, só para pré-visualizações noutro endereço. O domínio está em `site.config.mjs` |
| `PUBLIC_BOOKING_URL` | Link da plataforma de marcações (projeto separado). Se ficar vazio, "Marcar uma conversa" abre o WhatsApp com a mensagem pré-preenchida |
| `PUBLIC_SHOW_PRICING` | `true` para mostrar a secção de preços |
| `PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`, `CONTACT_DRY_RUN` | Formulário de contacto (ver abaixo) |
| `PUBLIC_UMAMI_SRC`, `PUBLIC_UMAMI_WEBSITE_ID`, `PUBLIC_UMAMI_HOST` | Estatísticas Umami, sem cookies. Vazio: não carrega nada. Só conta visitas no domínio de `site.config.mjs` |

As variáveis `PUBLIC_*` entram no build (incluindo a CSP); as outras são lidas pela função do `/api/contact` em tempo de execução.

Nunca coloque segredos no repositório. O `.env` está no `.gitignore`.

## Compatibilidade

Alvo: as duas últimas versões de Safari (iOS e macOS), Chrome (Android e desktop), Edge e Firefox (ver `browserslist` no `package.json`).

- **iOS:** os campos têm sempre letra ≥ 16 px, para evitar o zoom automático. Com `viewport-fit=cover`, as margens respeitam `env(safe-area-inset-*)`. Nenhuma secção usa `100vh`; se for preciso altura de ecrã, usar `svh`/`dvh`.
- **Toque:** todas as áreas de toque têm pelo menos 44 × 44 px, exceto links dentro de texto corrido. Nada depende só de hover; o Tailwind 4 só aplica `hover:` em dispositivos com rato.
- **Movimento:** está em `src/styles/motion.css` e `src/scripts/motion.ts`, e só é ativado quando o sistema não pede movimento reduzido (classe `.motion` no `<html>`). Sem JavaScript, ou com movimento reduzido, tudo aparece logo no estado final. O ciclo do hero tem um botão de pausa (WCAG 2.2.2) e para sozinho quando sai do ecrã. Se o script falhar, uma salvaguarda em CSS mostra os elementos ao fim de 4 s.
- Antes de publicar, testar também em aparelhos reais (iPhone e Android), porque a emulação não reproduz tudo.

## Formulário de contacto

`POST /api/contact` (`src/pages/api/contact.ts`, lógica em `src/lib/contact.ts`) corre numa Vercel Function. O resto do site é estático. Por ordem, faz:

1. verificação da origem (só aceita pedidos do próprio site) e do tamanho máximo;
2. honeypot (campo escondido "website": se vier preenchido, responde "ok" e não envia nada);
3. limite de **5 pedidos por minuto por IP**, em memória (por instância da função);
4. validação dos campos, com mensagens em português;
5. Cloudflare Turnstile;
6. envio pelo Resend.

Com JavaScript, o formulário mostra os erros junto a cada campo e a confirmação no próprio sítio. Sem JavaScript, faz um POST normal e redireciona para `/contacto/obrigado` ou `/contacto/erro`. O Turnstile, porém, precisa de JavaScript, por isso sem ele o envio é recusado e a página de erro sugere o WhatsApp.

**Modo simulado:** com `CONTACT_DRY_RUN=true`, ou em desenvolvimento sem `RESEND_API_KEY`, valida tudo mas não envia o email. Em produção, sem chaves e sem modo simulado, responde que o formulário não está disponível e sugere o WhatsApp. Nunca perde mensagens em silêncio.

**Chaves de teste do Turnstile** (já no `.env.example`): site `1x00000000000000000000AA` e segredo `1x0000000000000000000000000000000AA` (passa sempre). O segredo `2x0000000000000000000000000000000AA` falha sempre.

**Ativar o envio real:**
1. No Resend, verificar o domínio e criar uma chave de API.
2. Na Cloudflare, criar o widget Turnstile para o domínio.
3. Na Vercel (Settings → Environment Variables), definir `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`, `TURNSTILE_SECRET_KEY` (secretos) e `PUBLIC_TURNSTILE_SITE_KEY`. Remover `CONTACT_DRY_RUN` ou pô-lo a `false`.
4. A `PUBLIC_TURNSTILE_SITE_KEY` entra no build: depois de a definir, publicar de novo.

Localmente, o `npm run preview` lê o `.env` ao arrancar. As variáveis `PUBLIC_*` entram no build: depois de as mudar, volte a fazer build.

## Marca

**Um só ficheiro de origem:** `public/brand/logo-source.svg`. Todos os outros são gerados por `npm run brand` (`scripts/build-brand.mjs`):

- `public/brand/`: `logo-horizontal(-dark).svg`, `logo-vertical(-dark).svg`, `symbol(-dark).svg`, `mark.svg` (só o F, para as marcas de água), `icon-app.svg`, `icon-profile.svg`
- `public/`: `favicon.svg`, `favicon-32.png`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`
- `public/og/default.png`: imagem de partilha 1200 × 630 (logótipo, título do hero de `home.json`, localidade)

**Trocar de logótipo:** substituir `logo-source.svg` pelo novo, seguindo as regras escritas no próprio ficheiro: um grupo `id="symbol"`, um grupo `id="wordmark"` (texto convertido em paths) e as classes `mark`, `accent`, `accent-ink` e `text`, que dizem a cor de cada forma em cada versão. Depois, `npm run brand` e `npm run build`. Se a forma nova pedir outra cor de fundo nos ícones ou outras cores, ajustar `VARIANTS` e `C` no início de `scripts/build-brand.mjs`.

Cores (brand board): `#0F766E` principal · `#115E59` escuro · `#F59E0B` âmbar · `#0F1F1C` texto · `#F0FAF7` fundo suave.
**Regra do âmbar:** usar só em pormenores e **nunca com texto branco por cima** (2,15 : 1). Quando houver texto sobre âmbar, é sempre escuro `#0F1F1C` (7,93 : 1).
Fontes do site: Manrope nos títulos e Inter no texto, ambas self-hosted via Fontsource com `font-display: swap` e pré-carregadas.

## SEO, segurança e desempenho

- **SEO:** título, descrição e canonical por página; Open Graph e cartão do X/Twitter com `/og/default.png`; schema.org `Organization` (nome comercial, sem dados de sociedade) e `WebSite` na página inicial; `robots.txt` e sitemap gerados a partir da URL canónica; páginas de `/contacto/` e 404 com `noindex` e fora do sitemap.
- **Cabeçalhos de segurança:** gerados no build por `integrations/security-headers.mjs` nas rotas de `.vercel/output/config.json`. A Content-Security-Policy leva o hash de cada script inline e só permite o Turnstile (`challenges.cloudflare.com`) e, se configurado, o Umami. HSTS de 1 ano com `includeSubDomains` (sem `preload`). Também `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy` e `Cross-Origin-Opener-Policy`. O build falha se alguém acrescentar um `onclick=` inline, que a CSP bloquearia.
- **Desempenho:** sem frameworks no cliente, CSS único, fontes pré-carregadas, imagens otimizadas no build. Resultados em `docs/lighthouse/resumo.md`.

## Estrutura

```
src/
  content/            conteúdos editáveis (ver acima)
  content.config.ts   esquema e validação dos conteúdos
  components/
    sections/         uma secção da página por ficheiro
    ui/               logótipo, ícones, cabeçalhos de secção
  layouts/            BaseLayout (todas as páginas) e LegalLayout
  pages/              index, privacidade, termos, 404 (futuro: blog/, casos/, produtos/)
  lib/site.ts         leitura dos conteúdos, marca, links de WhatsApp e de marcação
  lib/contact.ts      validação e email do formulário
  pages/api/contact.ts  o único código que corre no servidor
  styles/global.css   tokens da marca (Tailwind @theme) e estilos base
site.config.mjs       nome, domínio, URL canónica, titulares, morada
integrations/         cabeçalhos de segurança (CSP) gerados no build
public/brand/         logo-source.svg (origem) e ficheiros gerados
scripts/              build-brand, verify, lighthouse
docs/lighthouse/      relatórios Lighthouse
A-CONFIRMAR.md        o que falta decidir ou preencher antes de publicar
```

Para crescer: as páginas novas vão para `src/pages/` e reutilizam o `BaseLayout`. Um blog ou casos de estudo completos passam a ser uma coleção nova em `content.config.ts`.

## Deploy (Vercel)

> Ainda não publicar a versão final: o nome e o domínio estão por confirmar. Ver `A-CONFIRMAR.md`.

O adaptador `@astrojs/vercel` gera `.vercel/output/` (Build Output API): as páginas são estáticas e só o `/api/contact` corre numa Vercel Function. Os cabeçalhos de segurança entram no `.vercel/output/config.json` (ver `integrations/security-headers.mjs`). Não há base de dados. Node.js 22.23.4 ou mais recente (exigência do Astro 7.4).

### 1. Primeira publicação (pré-visualização em `*.vercel.app`)

Pelo Git (recomendado, publica a cada push):
1. Vercel → **Add New → Project** → importar o repositório (a app da Vercel no GitHub tem de ter acesso a ele). O `vercel.json` já fixa o framework (Astro), o build e a instalação.
2. Em **Settings → Environment Variables**: `PUBLIC_TURNSTILE_SITE_KEY`, `PUBLIC_BOOKING_URL`, `PUBLIC_SHOW_PRICING`, `PUBLIC_UMAMI_*`, os segredos `TURNSTILE_SECRET_KEY`, `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL` e, só nesta fase, `PUBLIC_SITE_URL` com o endereço `*.vercel.app`. `CONTACT_DRY_RUN` = `true` enquanto não houver Resend.
3. As variáveis `PUBLIC_*` entram no build: depois de as mudar, publicar de novo.

Ou pelo terminal: `npx vercel link`, `npx vercel env add NOME production`, `npx vercel deploy --prod`.

O limite de pedidos é em memória, por instância da função: é uma salvaguarda, não um limite global. O Turnstile continua a ser a proteção principal contra spam.

### 2. Domínio próprio

1. No projeto: **Settings → Domains → Add**, com o domínio e o `www.` (a Vercel propõe o redirecionamento de `www.` para o domínio sem `www`). Criar os registos DNS que a Vercel indicar no registo do domínio.
2. Retirar `PUBLIC_SITE_URL` (passa a valer o `DOMAIN` de `site.config.mjs`) e publicar de novo.
3. Em **Settings → Deployment Protection**, manter os *preview URLs* protegidos, para não haver uma cópia do site indexada noutro endereço.

### 3. Serviços externos

- **Turnstile** (Cloudflare, funciona fora da Cloudflare): widget *Managed* com o domínio na lista de hostnames (e o `*.vercel.app` enquanto for usado). Chaves no passo 1.
- **Resend:** adicionar o domínio, criar os registos DNS que o Resend indicar (SPF, DKIM) e um registo DMARC; `CONTACT_FROM_EMAIL` com um endereço desse domínio. Depois `CONTACT_DRY_RUN=false` (ou apagar).
- **Umami:** criar o site com o domínio e preencher `PUBLIC_UMAMI_SRC` e `PUBLIC_UMAMI_WEBSITE_ID`. Publicar de novo: a CSP é regenerada com o endereço do Umami.

### 4. Depois de publicar

- Enviar um pedido real pelo formulário (com e sem JavaScript) e confirmar que o email chega.
- [securityheaders.com](https://securityheaders.com) e a consola do browser (sem avisos de CSP), com o Umami ligado.
- [PageSpeed Insights](https://pagespeed.web.dev) com a URL pública.
- Google Search Console: verificar o domínio e enviar `/sitemap-index.xml`.
- Pré-visualização da partilha (ex.: LinkedIn Post Inspector).
- Testar em iPhone e Android reais.
- **HSTS preload:** só quando o domínio estiver definitivo e todos os subdomínios em HTTPS. Mudar em `astro.config.mjs` (`securityHeaders({ hsts: 'max-age=63072000; includeSubDomains; preload' })`) e submeter em hstspreload.org. É difícil de reverter.

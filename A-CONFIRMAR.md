# O que falta confirmar

No site, o que falta aparece com a etiqueta amarela **A CONFIRMAR**. Antes de publicar, procurar no repositório por `A CONFIRMAR` não deve devolver nada visível ao público.

## Bloqueia a publicação

| # | O quê | Onde se preenche | Notas |
|---|---|---|---|
| 1 | **Nome comercial** (registo de marca) | `site.config.mjs` → `BRAND_NAME` | Se mudar, o logótipo também muda (ver "Pode ficar para depois", n.º 1). |
| 2 | **Domínio** | `site.config.mjs` → `DOMAIN` | Depois: domínio no projeto da Vercel, hostnames do Turnstile, domínio no Resend, site no Umami. Ver README → Deploy. |
| 3 | **Chaves do Turnstile** (site e segredo) | Widget na Cloudflare; valores nas variáveis da Vercel (`PUBLIC_TURNSTILE_SITE_KEY`, segredo `TURNSTILE_SECRET_KEY`) | Hoje, na Vercel: sem chaves, o formulário responde que ainda não está disponível e aponta para o WhatsApp. |
| 4 | **Resend**: domínio verificado e chave de API | Variáveis da Vercel: `RESEND_API_KEY`; desligar `CONTACT_DRY_RUN` | Hoje: envio simulado. Sem isto, os pedidos do formulário não chegam a ninguém. |
| 5 | **Endereços do formulário**: para onde vão os pedidos e de onde saem | `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL` | O remetente tem de ser do domínio verificado no Resend. |
| 6 | **NIF** de Lourenço Couto e de Pedro Marques | `site.config.mjs` → `OWNERS` | Aparecem na Política de Privacidade e nos Termos. |
| 7 | **Morada profissional** | `site.config.mjs` → `ADDRESS` | Idem. |
| 8 | **Email de contacto** | `src/content/settings.json` → `contacts.email` | Também é o contacto para os direitos RGPD. |
| 9 | **WhatsApp**: número e forma de o mostrar | `settings.json` → `contacts.whatsapp` (só dígitos, ex.: `351912345678`) e `contacts.phoneDisplay` | Sem número, os botões de WhatsApp levam ao formulário. |
| 10 | **Revisão jurídica** das páginas legais | `src/pages/privacidade.astro`, `src/pages/termos.astro` | Retirar a caixa "Rascunho" depois da revisão. |
| 11 | **Prazo de conservação** dos pedidos de contacto | `privacidade.astro`, secção 4 | O RGPD obriga a indicar o prazo. |
| 12 | **Resolução alternativa de litígios** (entidade) e **Livro de Reclamações** (se é obrigatório para esta atividade) | `termos.astro`, secção 6 | Confirmar com jurista ou contabilista. |
| 13 | **Data de publicação** das páginas legais | `privacidade.astro` e `termos.astro` → `updated` | |

## Pode ficar para depois

O site funciona sem estes pontos e não mostra etiquetas ao público por causa deles.

| # | O quê | Onde se preenche | Enquanto não houver |
|---|---|---|---|
| 1 | **Logótipo novo** | Substituir `public/brand/logo-source.svg` e correr `npm run brand` e `npm run build` | Fica o logótipo atual. Se o nome mudar, passa a bloquear. |
| 2 | **Instagram e LinkedIn** | `settings.json` → `social` | Não aparecem no rodapé. |
| 3 | **Umami** (estatísticas) | `PUBLIC_UMAMI_SRC`, `PUBLIC_UMAMI_WEBSITE_ID` | Não se recolhem estatísticas. A Política de Privacidade menciona o Umami: se não o usarem, retirar essa referência. |
| 4 | **Fotografias dos fundadores** | `src/assets/team/` e `founders.json` → `photo` | Aparecem as iniciais. |
| 5 | **Plataforma de marcações** | `PUBLIC_BOOKING_URL` | "Marcar uma conversa" abre o WhatsApp. |
| 6 | **Preços** ("a partir de … €/mês") | `home.json` → `pricing` e `PUBLIC_SHOW_PRICING=true` | A secção fica escondida. |
| 7 | **Casos reais** | `src/content/cases/` (modelo em `_modelo-caso-real.md.txt`) | Ficam os 4 projetos de demonstração, identificados como tal. |
| 8 | **HSTS preload** | `astro.config.mjs` | Só depois de o domínio ser definitivo. Ver README → Deploy. |
| 9 | **Nome do projeto na Vercel** (`flowops-site`) | Painel da Vercel | Só se o nome mudar; não é visível no site com domínio próprio. |
| 10 | **`npm audit`** | `package.json` | Aponta `path-to-regexp` em `@vercel/routing-utils` (dependência do adaptador da Vercel, usada só no build para gerar rotas; não recebe pedidos dos visitantes). Rever quando sair versão nova do `@astrojs/vercel`. |

## Verificações do vosso lado

- **Firefox:** correr `npm run build && npm run verify` num terminal normal (no ambiente onde trabalho o Firefox não arranca).
- **Aparelhos reais:** iPhone e Android, antes de publicar.
- **Depois de publicar:** a lista em README → Deploy → "Depois de publicar".

# Website da FlowOps

Site institucional da FlowOps: software, websites e apps à medida, em Lisboa.
Feito com [Astro](https://astro.build) 7, Tailwind CSS 4 e TypeScript. O site é estático; só o formulário de contacto (`/api/contact`) corre no servidor.

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
| `npm run preview` | Serve o build localmente |
| `npm run check` | Verifica tipos e conteúdos |
| `npm run verify` | Verificação em Chromium, WebKit (Safari) e Firefox: 320, 375, 768, 1024, 1280, 1440, 1920 px, telemóvel na horizontal, iPhone, iPad e Android. Mede scroll horizontal, áreas de toque < 44 px, campos < 16 px e erros de JavaScript, e faz uma passagem com movimento ativo (ciclo do hero, pausa, nada escondido depois do scroll); capturas em `screenshots/` (precisa de `npx playwright install chromium firefox webkit`) |

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
| `PUBLIC_SITE_URL` | Domínio final, usado no canonical e no sitemap |
| `PUBLIC_BOOKING_URL` | Link da plataforma de marcações (projeto separado). Se ficar vazio, "Marcar uma conversa" abre o WhatsApp com a mensagem pré-preenchida |
| `PUBLIC_SHOW_PRICING` | `true` para mostrar a secção de preços |
| `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`, `PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | Formulário de contacto (fase 4) |

Nunca coloque segredos no repositório. O `.env` está no `.gitignore`.

## Compatibilidade

Alvo: as duas últimas versões de Safari (iOS e macOS), Chrome (Android e desktop), Edge e Firefox (ver `browserslist` no `package.json`).

- **iOS:** os campos têm sempre letra ≥ 16 px, para evitar o zoom automático. Com `viewport-fit=cover`, as margens respeitam `env(safe-area-inset-*)`. Nenhuma secção usa `100vh`; se for preciso altura de ecrã, usar `svh`/`dvh`.
- **Toque:** todas as áreas de toque têm pelo menos 44 × 44 px, exceto links dentro de texto corrido. Nada depende só de hover; o Tailwind 4 só aplica `hover:` em dispositivos com rato.
- **Movimento:** está em `src/styles/motion.css` e `src/scripts/motion.ts`, e só é ativado quando o sistema não pede movimento reduzido (classe `.motion` no `<html>`). Sem JavaScript, ou com movimento reduzido, tudo aparece logo no estado final. O ciclo do hero tem um botão de pausa (WCAG 2.2.2) e para sozinho quando sai do ecrã. Se o script falhar, uma salvaguarda em CSS mostra os elementos ao fim de 4 s.
- Antes de publicar, testar também em aparelhos reais (iPhone e Android), porque a emulação não reproduz tudo.

## Marca

Os ficheiros finais estão em `public/brand/`:

- `logo-horizontal(-dark).svg` e `logo-vertical(-dark).svg`
- `symbol(-dark).svg`
- `icon-app.svg` e `icon-profile.svg`
- em `public/`: `favicon.svg`, `favicon-32.png`, `apple-touch-icon.png`, `icon-192.png` e `icon-512.png`

Todos são gerados por script:

```bash
# precisa de: pip install fonttools uharfbuzz   e da fonte Outfit[wght].ttf (Google Fonts, licença OFL)
python scripts/build-brand.py caminho/Outfit[wght].ttf   # SVG, com o wordmark convertido em paths
node scripts/build-icons.mjs                             # PNG do favicon e dos ícones
```

Cores (brand board): `#0F766E` principal · `#115E59` escuro · `#F59E0B` âmbar · `#0F1F1C` texto · `#F0FAF7` fundo suave.
**Regra do âmbar:** usar só em pormenores e **nunca com texto branco por cima** (2,15 : 1). Quando houver texto sobre âmbar, é sempre escuro `#0F1F1C` (7,93 : 1).
Fontes do site: Manrope nos títulos e Inter no texto, ambas self-hosted via Fontsource com `font-display: swap`.

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
  lib/site.ts         leitura dos conteúdos, links de WhatsApp e de marcação
  styles/global.css   tokens da marca (Tailwind @theme) e estilos base
public/brand/         logótipos e ícones
scripts/              geração da marca e capturas de verificação
```

Para crescer: as páginas novas vão para `src/pages/` e reutilizam o `BaseLayout`. Um blog ou casos de estudo completos passam a ser uma coleção nova em `content.config.ts`.

## Deploy

As instruções completas para a Cloudflare, com o domínio próprio `[A CONFIRMAR: flowops.pt]`, entram na fase 5, juntamente com o formulário. Resumo: ligar o repositório na Cloudflare (Workers & Pages), comando de build `npm run build`, pasta `dist`, e definir as variáveis do `.env` no painel.

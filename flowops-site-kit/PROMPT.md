# Prompt para Claude Code: Website da FlowOps

## Papel e contexto

És um designer e developer front-end sénior, especialista em websites de marca rápidos, acessíveis e que convertem visitantes em contactos.

A **FlowOps** é uma empresa nova, fundada por dois sócios, **Lourenço Couto** e **Pedro Marques**, em Lisboa. **Desenvolvemos software, websites e apps à medida para resolver os problemas concretos de cada negócio**: processos manuais e repetitivos, falta de presença online, informação espalhada por papel, Excel e WhatsApp, tarefas que podiam ser automatizadas.

A nossa abordagem: **primeiro ouvimos e percebemos o problema, depois criamos a solução certa** (um website, uma app, um sistema de gestão, uma automatização ou uma integração entre ferramentas). Não vendemos um produto fechado.

**Importante:** os sistemas de marcações online para negócios de serviços (barbearias, salões, estética) são **um exemplo** do que fazemos e a área onde temos os primeiros contactos, **não** o nosso único serviço. O site não pode dar a entender que somos uma empresa de marcações.

O objetivo do site é: **gerar confiança e levar o visitante a falar connosco sobre o problema do negócio dele** (WhatsApp ou marcar uma conversa).

---

## Público-alvo (orienta todas as decisões)

- Donos e gestores de pequenas e médias empresas e negócios locais de qualquer setor (serviços, comércio, restauração, beleza, oficinas, clínicas, escritórios…). Na maioria não são pessoas de tecnologia.
- Vão abrir o site **no telemóvel**, quase sempre a partir de um link enviado por WhatsApp ou Instagram, muitas vezes entre dois clientes.
- Têm de perceber **em 5 segundos** o que fazemos, para quem é e que somos pessoas reais e de confiança.
- Têm receio de coisas "complicadas" ou "caras". O site tem de transmitir o contrário: simples, próximo, acessível.

---

## Direção de design

**Simples e funcional, mas com personalidade. Nada de 3D nem efeitos pesados.**

- **Elemento de destaque = o nosso trabalho:** no hero, uma animação leve (SVG/CSS) que mostra **vários tipos de solução** em ciclo, por exemplo um ecrã de telemóvel/portátil que passa por: um website de um negócio → uma marcação confirmada → um painel de gestão com números → uma notificação automática ("Fatura enviada ✓" / "Lembrete enviado ✓"). A ideia a transmitir: "o trabalho manual passa a fazer-se sozinho". Não deve parecer que só fazemos marcações.
- **Base limpa** (muito espaço em branco, tipografia grande e legível) com **uma cor forte de destaque** usada em botões, realces e detalhes. Propõe 3 opções de paleta (com códigos e contraste WCAG AA verificado) antes de implementar.
- **Tipografia:** uma sans-serif moderna e amigável para títulos e uma sans-serif muito legível para texto. Propõe 2 combinações (Google Fonts ou self-hosted).
- **Microanimações subtis:** fade/slide ao fazer scroll, botões com feedback ao toque. Respeitar `prefers-reduced-motion`.
- **Fotografias reais dos fundadores** (placeholders preparados em `public/images/team/`). Pessoas reais vendem mais do que ilustrações.
- **Logótipo e identidade (APROVADOS, substituem qualquer proposta anterior):** ver `assets/brand/logo-referencia.png` e `assets/brand/brand-board.png`.
  - **Símbolo:** um "F" formado por duas faixas largas e inclinadas em verde #0F766E, com cantos arredondados e curvas suaves (sensação de movimento/fluxo), e um **círculo âmbar #F59E0B com um visto (✓) branco** encaixado no canto inferior direito do F.
  - **Wordmark:** "FlowOps" numa sans-serif geométrica muito negrita, em #0F1F1C (F e O maiúsculos).
  - **Versões:** horizontal (símbolo à esquerda + nome), vertical (símbolo em cima + nome), fundo escuro (#0F1F1C, F em verde-água claro #5EEAD4, texto branco, círculo âmbar), ícone/app (F branco + círculo âmbar sobre quadrado arredondado #0F766E), foto de perfil circular.
  - As imagens são geradas por IA (raster): **redesenha o logótipo em SVG limpo e fiel à referência** (formas geométricas precisas, espessuras consistentes, wordmark com uma fonte real convertida em paths, ex.: uma geométrica bold como Outfit, Plus Jakarta Sans ExtraBold ou semelhante, escolhe a mais próxima e mostra-nos). Gera todas as versões acima + favicon (SVG e PNG 32/180/512) em `public/brand/`.
  - Os dados do cartão de visita na referência são exemplos; não os uses no site.
- **Uso do âmbar:** só em pormenores (o ✓ do logótipo, pequenos realces, ícones de sucesso). **Nunca texto branco sobre âmbar** (contraste 2,15 : 1, falha WCAG). Os botões principais são verdes #0F766E com texto branco; se algum botão for âmbar, o texto tem de ser escuro #0F1F1C.
- Sensação final: **empresa séria, segura e madura, que resolve problemas**, mas próxima e acessível. Evitar o ar de agência cara, de startup fria ou de algo demasiado descontraído.

---

## Tom e textos (português de Portugal)

- **Seguro, claro e profissional, mas humano.** Frases curtas. **Tratamento neutro ou "você"** (não usar "tu"); nada de jargão técnico, sem emojis.
- A mensagem central: **somos a solução para os problemas das empresas.** Falar de problemas e resultados, não de tecnologia. Exemplos de tom (podes melhorar):
  - "Identificamos o que está a travar o seu negócio e desenvolvemos a solução certa."
  - "Software, websites e apps à medida, para eliminar processos manuais e informação espalhada."
  - "Menos trabalho manual. Mais tempo para o que importa."
  - "O trabalho manual passa a fazer-se sozinho." (frase de marca)
- Escreve todos os textos finais; marca com `[A CONFIRMAR]` tudo o que dependa de informação nossa (preços, contactos, números).

---

## Estrutura (one-page com âncoras + páginas legais)

1. **Header:** logo, navegação curta (Como funciona · Exemplos · Sobre nós · Contacto), botão "Falar connosco" sempre visível. Menu simples no telemóvel.
2. **Hero:** título forte, subtítulo com o benefício, 2 botões ("Falar no WhatsApp" e "Marcar uma conversa"), mockup animado do telemóvel.
3. **Problema → solução:** 4 dores comuns a qualquer negócio (tarefas manuais e repetitivas; informação espalhada entre papel, Excel e WhatsApp; sem presença online ou com um site que não ajuda; clientes e pedidos que se perdem) e como resolvemos cada uma.
4. **O que fazemos (serviços):** cartões com as áreas, cada uma com 1 frase e 1 exemplo concreto: **Websites** (sites profissionais e rápidos), **Apps** (Android/iOS, área onde temos formação específica), **Sistemas de gestão à medida** (clientes, pedidos, stock, agenda), **Automatizações** (lembretes, emails, faturas, relatórios automáticos), **Integrações** (ligar as ferramentas que o negócio já usa), **Manutenção e suporte**.
5. **Como trabalhamos (método, transmite maturidade):** 4 passos: **Diagnóstico** (reunião para perceber o problema, sem custo) → **Proposta por escrito** (solução, preço e prazo definidos antes de começar) → **Desenvolvimento acompanhado** (o cliente vê o progresso) → **Entrega e suporte contínuo** (alojamento, manutenção, melhorias).
5b. **Os nossos compromissos (transmite segurança):** preço e prazo acordados por escrito, sem surpresas; o sistema e os dados pertencem ao cliente; segurança e RGPD desde o início; suporte com tempo de resposta definido `[A CONFIRMAR]`. Apenas compromissos que conseguimos cumprir.
6. **Exemplos (portefólio):** grelha preparada para vários tipos de projeto (filtros por tipo: Website · App · Sistema · Automatização). Cada projeto apresentado como caso: **Problema → Solução → Resultado esperado**. Começa com 2–3 projetos de demonstração **de tipos diferentes** (ex.: sistema de marcações para um negócio de serviços, website para uma empresa local, painel de gestão/automatização), com **nomes fictícios neutros e profissionais** (nada de nomes humorísticos), imagem/mockup e link para a demo. **Identificar claramente como "Projeto de demonstração"**, nunca como cliente real. Estrutura preparada para adicionar casos reais mais tarde (com logo, testemunho e resultados).
7. **Sobre nós:** foto e 2–3 linhas de cada fundador, porque decidimos criar a FlowOps, compromisso de proximidade ("somos de Lisboa, falamos contigo pessoalmente"). Usa esta informação real (escrita de forma próxima e confiante, sem exageros nem currículo formal):
   - **Percurso comum:** o Lourenço e o Pedro concluíram o **CTeSP em Desenvolvimento para Dispositivos Móveis no ISTEC, em Lisboa**, e estão agora no **2.º ano da Licenciatura em Engenharia Informática**.
   - **Lourenço Couto:** estágio profissional de **6 meses na Unipartner**, em Lisboa, a trabalhar em desenvolvimento de software.
   - **Pedro Marques:** estágio profissional de **6 meses na QUIC**, em Lisboa, a trabalhar em desenvolvimento de software.
   - Mensagem a transmitir: formação técnica sólida e experiência real em empresas de software, agora ao serviço dos negócios do bairro, com a vantagem de serem jovens, próximos e disponíveis.
   - Não inventar outros dados (anos de experiência, número de projetos, tecnologias específicas, prémios). Não usar logótipos da ISTEC, Unipartner ou QUIC sem autorização; mencionar apenas os nomes em texto.
8. **Preços (opcional, desligável por configuração):** "a partir de [A CONFIRMAR] €/mês" ou "Fala connosco para uma proposta à medida". Deixar a secção pronta mas escondida por defeito.
9. **Perguntas frequentes:** 5–6 perguntas reais (Preciso de saber de informática? Que tipo de projetos fazem? Quanto custa um projeto? Quanto tempo demora? Quem trata da manutenção depois? Os dados do meu negócio estão seguros?).
10. **Contacto / CTA final:** botão grande de WhatsApp, email, botão "Marcar uma conversa" e formulário curto (nome, negócio, telemóvel, mensagem) com consentimento RGPD.
11. **Footer:** contactos, redes sociais, links legais, © FlowOps.

**Não inventar testemunhos, números de clientes, logótipos de clientes nem estatísticas.** Se uma secção precisar disso, deixar estrutura preparada e escondida até termos dados reais.

---

## Integração com o nosso produto

- O botão "Marcar uma conversa" pode, no futuro, usar **o sistema de marcações que desenvolvemos**, como demonstração viva do nosso trabalho. Para já, implementa-o atrás de uma configuração: `BOOKING_URL` (link externo) ou, se não definido, abre WhatsApp com mensagem pré-preenchida ("Olá! Vi o site da FlowOps e gostava de saber mais.").
- Formulário de contacto: envio por email via serviço configurável (ex.: Resend) com proteção anti-spam (Cloudflare Turnstile + honeypot + rate limiting).

---

## Requisitos técnicos

- **Stack sugerida:** Astro (ou Next.js com export estático) + Tailwind CSS + TypeScript. Justifica a escolha no plano. Site maioritariamente estático, sem JavaScript desnecessário.
- **Performance:** Lighthouse ≥ 95 em mobile em todas as categorias; imagens otimizadas (AVIF/WebP, `srcset`, lazy loading); fontes com `font-display: swap`; animação do hero leve (< 100 KB).
- **Acessibilidade:** WCAG 2.1 AA, navegação por teclado, contraste verificado, textos alternativos, semântica correta.
- **SEO local:** metadados por página, Open Graph/Twitter cards com imagem própria, `schema.org/Organization` e `LocalBusiness` (Lisboa), sitemap, robots.txt, URLs limpas. Palavras-chave naturais: "desenvolvimento de software à medida Lisboa", "criação de websites para empresas", "automatização de processos para pequenas empresas", "desenvolvimento de apps", "sistema de marcações online".
- **Segurança:** headers de segurança (CSP, HSTS, etc.), sem segredos no repositório, `.env.example`.
- **RGPD:** Política de Privacidade, Termos, e banner de cookies **apenas** se usarmos cookies não essenciais. Preferir analytics sem cookies (ex.: Plausible ou Umami).
- **Conteúdo editável:** textos, contactos, projetos do portefólio e FAQ em ficheiros de conteúdo (Markdown/JSON ou content collections), para alterarmos sem mexer no código.
- **Preparado para crescer:** estrutura que permita mais tarde adicionar páginas de produto, blog e casos de estudo.
- **Deploy:** instruções para Vercel, Netlify ou Cloudflare Pages, com domínio próprio (`[A CONFIRMAR: flowops.pt]`).
- `README.md` com como correr localmente, onde editar cada conteúdo e como fazer deploy.

---

## Dados (preencher antes de enviar)

- Domínio: `[A CONFIRMAR]`
- WhatsApp: `[A CONFIRMAR]`
- Email: `[A CONFIRMAR]`
- Instagram / LinkedIn: `[A CONFIRMAR]`
- Fotos dos fundadores: `[A ENVIAR]`
- Preços: `[A CONFIRMAR]`

---

## Forma de trabalhar

1. **Antes de escrever código**, apresenta: o plano da página (wireframe em texto de cada secção), as 3 propostas de paleta, as 2 combinações de fontes, a proposta de logótipo e a stack. **Espera pela nossa aprovação.**
2. Depois implementa por fases (estrutura e conteúdos → design → animação do hero → formulários e integrações → SEO, acessibilidade e performance), verificando no fim de cada fase em largura de telemóvel (375 px) e desktop.
3. No fim, entrega o relatório do Lighthouse e uma lista do que ficou `[A CONFIRMAR]`.

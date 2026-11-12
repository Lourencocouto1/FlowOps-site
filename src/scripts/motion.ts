// Fase 3: movimento discreto. Sem bibliotecas; só corre se <html> tiver a classe .motion
// (posta no <head> quando o utilizador não pediu movimento reduzido).
const root = document.documentElement;
const motion = root.classList.contains('motion');

// 1. Aparecimento ao fazer scroll, com um pequeno escalonamento entre cartões vizinhos.
function initReveal() {
  const items = [...document.querySelectorAll<HTMLElement>('.reveal')];
  if (!motion) {
    items.forEach((el) => el.classList.add('in'));
    return;
  }
  const vh = window.innerHeight;
  // O que já está no ecrã ao carregar aparece logo.
  items.forEach((el) => {
    if (el.getBoundingClientRect().top < vh * 0.92) el.classList.add('in');
  });
  const io = new IntersectionObserver(
    (entries) => {
      entries
        .filter((e) => e.isIntersecting)
        .forEach((e, i) => {
          io.unobserve(e.target);
          window.setTimeout(() => e.target.classList.add('in'), Math.min(i, 3) * 90);
        });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
  );
  items.filter((el) => !el.classList.contains('in')).forEach((el) => io.observe(el));
}

// 2. Linha do método: progresso de 0 a 1 ligado ao scroll, só enquanto a secção está visível.
function initFlow() {
  const flow = document.querySelector<HTMLElement>('[data-flow]');
  if (!flow || !motion) return;
  const nodes = [...flow.querySelectorAll<HTMLElement>('[data-flow-node]')];
  let ticking = false;
  const update = () => {
    ticking = false;
    const r = flow.getBoundingClientRect();
    const p = Math.max(0, Math.min(1, (window.innerHeight * 0.8 - r.top) / (r.height * 0.85 + 1)));
    flow.style.setProperty('--p', p.toFixed(3));
    nodes.forEach((n, i) => n.classList.toggle('lit', p >= i / nodes.length + 0.01));
    flow.classList.toggle('done', p >= 0.98);
  };
  const onScroll = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  };
  update();
  new IntersectionObserver(([entry]) => {
    if (entry?.isIntersecting) {
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll, { passive: true });
      update();
    } else {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      update();
    }
  }).observe(flow);
}

// 3. Hero: os 4 exemplos do telemóvel. Clicar num nome ou nas setas mostra esse exemplo; com movimento,
// avançam sozinhos a cada 5 s (o primeiro espera pelo ecrã de abertura), com botão de pausa (WCAG 2.2.2)
// e pausa automática quando o hero sai do ecrã (poupa bateria).
function initHero() {
  const stage = document.querySelector<HTMLElement>('.hero-stage');
  if (!stage) return;
  const scenes = [...stage.querySelectorAll<HTMLElement>('.mk-scene')];
  const steps = [...stage.querySelectorAll<HTMLButtonElement>('[data-step]')];
  const btn = stage.querySelector<HTMLButtonElement>('[data-hero-pause]');
  const label = btn?.querySelector<HTMLElement>('[data-label]');
  const STEP_MS = 5000;
  const BOOT_MS = 2900; // igual a --boot em motion.css
  let firstAt = performance.now() + BOOT_MS + STEP_MS; // primeira troca automática
  let current = 0;
  let timer = 0;
  let paused = false;
  let offscreen = false;

  const show = (i: number) => {
    current = (i + scenes.length) % scenes.length;
    scenes.forEach((s, n) => s.classList.toggle('is-active', n === current));
    steps.forEach((b, n) => {
      b.classList.toggle('is-active', n === current);
      b.setAttribute('aria-current', String(n === current));
    });
  };
  const schedule = () => {
    window.clearTimeout(timer);
    if (!motion || paused || offscreen) return;
    timer = window.setTimeout(() => {
      show(current + 1);
      schedule();
    }, Math.max(STEP_MS, firstAt - performance.now()));
  };
  const go = (i: number) => {
    firstAt = 0;
    show(i);
    schedule();
  };

  steps.forEach((b, n) => b.addEventListener('click', () => go(n)));
  stage.querySelector('[data-prev]')?.addEventListener('click', () => go(current - 1));
  stage.querySelector('[data-next]')?.addEventListener('click', () => go(current + 1));
  if (!motion) return;

  btn?.addEventListener('click', () => {
    paused = !paused;
    stage.classList.toggle('is-paused', paused);
    btn.setAttribute('aria-pressed', String(paused));
    if (label) label.textContent = paused ? 'Retomar animação' : 'Pausar animação';
    schedule();
  });
  new IntersectionObserver(([entry]) => {
    offscreen = !entry?.isIntersecting;
    stage.classList.toggle('is-offscreen', offscreen);
    schedule();
  }).observe(stage);
  schedule();
}

// 4. Problemas, "antes → depois": escolher um problema mostra a cena desarrumada e, logo a seguir,
// as peças arrumam-se. Os botões Antes/Depois deixam comparar à mão. Sem movimento, fica sempre o "depois"
// (e os botões trocam sem animação).
function initProblems() {
  const root = document.querySelector<HTMLElement>('[data-pb]');
  const stage = root?.querySelector<HTMLElement>('[data-pb-stage]');
  if (!root || !stage) return;
  const items = [...root.querySelectorAll<HTMLButtonElement>('[data-pb-item]')];
  const scenes = [...root.querySelectorAll<HTMLElement>('[data-pb-scene]')];
  const caps = [...root.querySelectorAll<HTMLElement>('[data-pb-cap]')];
  const modes = [...root.querySelectorAll<HTMLButtonElement>('[data-pb-mode]')];
  const TIDY_MS = 900;
  let timer = 0;

  const setBefore = (before: boolean) => {
    stage.classList.toggle('is-before', before);
    modes.forEach((b) => b.setAttribute('aria-pressed', String((b.dataset.pbMode === 'before') === before)));
  };
  const play = (delay = TIDY_MS) => {
    window.clearTimeout(timer);
    if (!motion) return setBefore(false);
    setBefore(true);
    timer = window.setTimeout(() => setBefore(false), delay);
  };
  const select = (i: number) => {
    items.forEach((b, n) => {
      b.classList.toggle('is-active', n === i);
      b.setAttribute('aria-pressed', String(n === i));
    });
    // A cena nova aparece já no "antes" (estava escondida, por isso não anima) e só depois se arruma.
    scenes.forEach((s, n) => (s.hidden = n !== i));
    caps.forEach((c, n) => (c.hidden = n !== i));
    play();
  };

  items.forEach((b, n) => b.addEventListener('click', () => select(n)));
  modes.forEach((b) =>
    b.addEventListener('click', () => {
      window.clearTimeout(timer);
      setBefore(b.dataset.pbMode === 'before');
    }),
  );
  if (!motion) return;

  // Começa desarrumado e arruma-se na primeira vez que a secção aparece no ecrã.
  setBefore(true);
  const io = new IntersectionObserver(
    ([entry]) => {
      if (!entry?.isIntersecting) return;
      io.disconnect();
      play(TIDY_MS + 300);
    },
    { threshold: 0.45 },
  );
  io.observe(stage);
}

initReveal();
initFlow();
initHero();
initProblems();

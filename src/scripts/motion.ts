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

// 3. Hero: botão de pausa (WCAG 2.2.2) e pausa automática quando sai do ecrã (poupa bateria).
function initHero() {
  const stage = document.querySelector<HTMLElement>('.hero-stage');
  if (!stage || !motion) return;
  const btn = stage.querySelector<HTMLButtonElement>('[data-hero-pause]');
  const label = btn?.querySelector<HTMLElement>('[data-label]');
  btn?.addEventListener('click', () => {
    const paused = stage.classList.toggle('is-paused');
    btn.setAttribute('aria-pressed', String(paused));
    if (label) label.textContent = paused ? 'Retomar animação' : 'Pausar animação';
  });
  new IntersectionObserver(([entry]) => {
    stage.classList.toggle('is-offscreen', !entry?.isIntersecting);
  }).observe(stage);
}

initReveal();
initFlow();
initHero();

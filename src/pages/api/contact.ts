// POST /api/contact: recebe o formulário de contacto e envia-o por email (Resend).
// Proteções: mesma origem, tamanho máximo, honeypot, limite de pedidos por IP, Cloudflare Turnstile.
// Funciona com JavaScript (resposta JSON) e sem JavaScript (redireciona para /contacto/obrigado ou /contacto/erro).
import type { APIRoute } from 'astro';
import {
  CONTACT_DRY_RUN,
  CONTACT_FROM_EMAIL,
  CONTACT_TO_EMAIL,
  RESEND_API_KEY,
  TURNSTILE_SECRET_KEY,
} from 'astro:env/server';
import { MAX_BODY_BYTES, buildEmail, isHoneypotFilled, memoryRateLimit, validateContact, type FieldErrors } from '../../lib/contact';

export const prerender = false;

type Reason = 'origem' | 'tamanho' | 'limite' | 'validacao' | 'verificacao' | 'envio' | 'configuracao';
const messages: Record<Reason, string> = {
  origem: 'Pedido inválido.',
  tamanho: 'A mensagem é demasiado longa.',
  limite: 'Recebemos vários pedidos seguidos. Aguarde um minuto e tente outra vez.',
  validacao: 'Há campos por preencher ou com erros.',
  verificacao: 'Não foi possível confirmar que é uma pessoa. Atualize a página e tente outra vez.',
  envio: 'Não conseguimos enviar a mensagem agora. Tente outra vez ou fale connosco pelo WhatsApp.',
  configuracao: 'O formulário ainda não está disponível. Fale connosco pelo WhatsApp.',
};
const status: Record<Reason, number> = { origem: 403, tamanho: 413, limite: 429, validacao: 400, verificacao: 400, envio: 502, configuracao: 503 };


export const POST: APIRoute = async ({ request, url, clientAddress }) => {
  const wantsJson = (request.headers.get('accept') ?? '').includes('application/json');
  const ok = () =>
    wantsJson ? Response.json({ ok: true }, { headers: noStore }) : Response.redirect(new URL('/contacto/obrigado', url), 303);
  const fail = (reason: Reason, errors?: FieldErrors) =>
    wantsJson
      ? Response.json({ ok: false, reason, message: messages[reason], errors }, { status: status[reason], headers: noStore })
      : Response.redirect(new URL(`/contacto/erro?motivo=${reason}`, url), 303);

  // 1. Mesma origem (o browser envia sempre Origin num POST).
  const origin = request.headers.get('origin');
  if (origin && new URL(origin).host !== url.host) return fail('origem');

  // 2. Tamanho.
  const length = Number(request.headers.get('content-length') ?? 0);
  if (length > MAX_BODY_BYTES) return fail('tamanho');

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail('validacao');
  }

  // 3. Honeypot: finge que correu bem, sem enviar nada.
  if (isHoneypotFilled(form)) return ok();

  // 4. Limite de pedidos por IP.
  // Na Vercel o clientAddress vem do x-forwarded-for definido pela própria plataforma (não pelo cliente).
  // Limite em memória: por instância da função, por isso é uma salvaguarda e não um limite global.
  const ip = clientAddress || 'desconhecido';
  if (!memoryRateLimit(ip)) return fail('limite');

  // 5. Validação dos campos.
  const result = validateContact(form);
  if (!result.ok) return fail('validacao', result.errors);

  // 6. Cloudflare Turnstile.
  if (!TURNSTILE_SECRET_KEY) {
    if (!import.meta.env.DEV) return fail('configuracao');
  } else {
    const token = String(form.get('cf-turnstile-response') ?? '');
    if (!token || !(await verifyTurnstile(token, TURNSTILE_SECRET_KEY, ip))) return fail('verificacao');
  }

  // 7. Envio (ou simulação).
  const email = buildEmail(result.data);
  if (CONTACT_DRY_RUN || !RESEND_API_KEY) {
    if (!CONTACT_DRY_RUN && !import.meta.env.DEV) return fail('configuracao');
    console.log('[contacto] envio simulado:', email.subject);
    return ok();
  }
  if (!CONTACT_TO_EMAIL || !CONTACT_FROM_EMAIL) return fail('configuracao');
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: CONTACT_FROM_EMAIL, to: [CONTACT_TO_EMAIL], subject: email.subject, text: email.text, html: email.html }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      console.error('[contacto] Resend respondeu', res.status, (await res.text()).slice(0, 300));
      return fail('envio');
    }
  } catch (e) {
    console.error('[contacto] erro no envio', e);
    return fail('envio');
  }
  return ok();
};

// Qualquer outro método: 405.
export const ALL: APIRoute = () => new Response('Método não permitido.', { status: 405, headers: { Allow: 'POST' } });

const noStore = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };

async function verifyTurnstile(token: string, secret: string, ip: string) {
  try {
    const body = new FormData();
    body.append('secret', secret);
    body.append('response', token);
    if (ip !== 'desconhecido') body.append('remoteip', ip);
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body, signal: AbortSignal.timeout(6000) });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch (e) {
    console.error('[contacto] erro na verificação Turnstile', e);
    return false;
  }
}

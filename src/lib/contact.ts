// Lógica do formulário de contacto, sem dependências do servidor (testável isoladamente).
import { z } from 'astro/zod';
import { BRAND_NAME } from '../../site.config.mjs';

export const MAX_BODY_BYTES = 20_000;

const text = (min: number, max: number, message: string) =>
  z.string({ error: message }).trim().min(min, { error: message }).max(max, { error: `Máximo de ${max} caracteres.` });

export const contactSchema = z.object({
  nome: text(2, 100, 'Indique o seu nome.'),
  negocio: text(2, 120, 'Indique o nome do negócio.'),
  telemovel: z
    .string({ error: 'Indique um número de telemóvel válido.' })
    .trim()
    .transform((v) => v.replace(/[\s().-]/g, ''))
    .pipe(z.string().regex(/^\+?\d{9,15}$/, { error: 'Indique um número de telemóvel válido.' })),
  mensagem: text(10, 2000, 'Escreva uma mensagem com pelo menos 10 caracteres.'),
  consentimento: z.literal('on', { error: 'É preciso aceitar a Política de Privacidade para lhe podermos responder.' }),
});

export type ContactData = z.infer<typeof contactSchema>;
export type FieldErrors = Partial<Record<keyof ContactData, string>>;

export function validateContact(form: FormData): { ok: true; data: ContactData } | { ok: false; errors: FieldErrors } {
  const raw = Object.fromEntries(
    (['nome', 'negocio', 'telemovel', 'mensagem', 'consentimento'] as const).map((k) => [k, form.get(k) ?? undefined]),
  );
  const parsed = contactSchema.safeParse(raw);
  if (parsed.success) return { ok: true, data: parsed.data };
  const errors: FieldErrors = {};
  for (const issue of parsed.error.issues) {
    const key = issue.path[0] as keyof ContactData;
    if (key && !errors[key]) errors[key] = issue.message;
  }
  return { ok: false, errors };
}

/** Bots preenchem o campo escondido "website". */
export const isHoneypotFilled = (form: FormData) => String(form.get('website') ?? '').trim() !== '';

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export function buildEmail(d: ContactData) {
  const subject = `Novo contacto pelo site: ${d.negocio}`.slice(0, 150);
  const textBody = [
    `Novo pedido de contacto pelo site da ${BRAND_NAME}.`,
    '',
    `Nome: ${d.nome}`,
    `Negócio: ${d.negocio}`,
    `Telemóvel: ${d.telemovel}`,
    '',
    'Mensagem:',
    d.mensagem,
    '',
    'Consentimento RGPD: aceite.',
  ].join('\n');
  const row = (k: string, v: string) => `<tr><td style="padding:4px 12px 4px 0;color:#4B5B57">${k}</td><td style="padding:4px 0"><strong>${escapeHtml(v)}</strong></td></tr>`;
  const html = `<div style="font-family:Arial,sans-serif;color:#0F1F1C;line-height:1.5">
<p>Novo pedido de contacto pelo site da ${BRAND_NAME}.</p>
<table>${row('Nome', d.nome)}${row('Negócio', d.negocio)}${row('Telemóvel', d.telemovel)}</table>
<p style="margin-top:16px;color:#4B5B57">Mensagem:</p>
<p style="white-space:pre-wrap">${escapeHtml(d.mensagem)}</p>
<p style="color:#4B5B57;font-size:13px">Consentimento RGPD: aceite.</p></div>`;
  return { subject, text: textBody, html };
}

/** Limite de pedidos em memória (salvaguarda quando o binding da Cloudflare não existe, ex.: em testes). */
const hits = new Map<string, number[]>();
export function memoryRateLimit(key: string, limit = 5, windowMs = 60_000, now = Date.now()) {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length <= limit;
}

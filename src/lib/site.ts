import { getCollection, getEntry } from 'astro:content';
import { PUBLIC_BOOKING_URL, PUBLIC_SHOW_PRICING } from 'astro:env/client';
import { ADDRESS, BRAND_NAME, DOMAIN, LOCALITY, OWNERS } from '../../site.config.mjs';

/** Marca e domínio: vêm todos de site.config.mjs (o único sítio a editar). */
export const brand = { name: BRAND_NAME, domain: DOMAIN, url: String(import.meta.env.SITE).replace(/\/$/, ''), owners: OWNERS, address: ADDRESS, ...LOCALITY };

/** "Lourenço Couto e Pedro Marques" */
export const ownersText = OWNERS.map((o) => o.name).join(' e ');

/** Troca {marca} pelo nome comercial em todos os textos de um objeto de conteúdo. */
export function withBrand<T>(value: T): T {
  if (typeof value === 'string') return value.replaceAll('{marca}', BRAND_NAME) as T;
  if (Array.isArray(value)) return value.map(withBrand) as T;
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, withBrand(v)])) as T;
  }
  return value;
}

export async function getSettings() {
  const entry = await getEntry('settings', 'site');
  if (!entry) throw new Error('Falta src/content/settings.json (entrada "site").');
  return { ...withBrand(entry.data), name: BRAND_NAME, city: LOCALITY.city, country: LOCALITY.country };
}

export async function getSection(id: string) {
  const entry = await getEntry('home', id);
  if (!entry) throw new Error(`Falta a secção "${id}" em src/content/home.json.`);
  return withBrand(entry.data);
}

/** Coleção ordenada pelo campo `order`. */
export async function getOrdered<C extends 'problems' | 'services' | 'steps' | 'commitments' | 'faq' | 'founders' | 'cases'>(name: C) {
  const items = (await getCollection(name)).map((item) => ({ ...item, data: withBrand(item.data) }));
  return items.sort((a, b) => (a.data as { order: number }).order - (b.data as { order: number }).order);
}

/** Link do WhatsApp com mensagem pré-preenchida. Sem número configurado, leva à secção de contacto. */
export function whatsappHref(number: string, message: string) {
  return number ? `https://wa.me/${number}?text=${encodeURIComponent(message)}` : '#contacto';
}

/** "Marcar uma conversa": plataforma de marcações se PUBLIC_BOOKING_URL estiver definido; senão, WhatsApp. */
export function bookingHref(number: string, message: string) {
  return PUBLIC_BOOKING_URL || whatsappHref(number, message);
}

export const isExternal = (href: string) => /^https?:\/\//.test(href);
export const showPricing = PUBLIC_SHOW_PRICING;

import { getCollection, getEntry } from 'astro:content';
import { PUBLIC_BOOKING_URL, PUBLIC_SHOW_PRICING } from 'astro:env/client';

export async function getSettings() {
  const entry = await getEntry('settings', 'site');
  if (!entry) throw new Error('Falta src/content/settings.json (entrada "site").');
  return entry.data;
}

export async function getSection(id: string) {
  const entry = await getEntry('home', id);
  if (!entry) throw new Error(`Falta a secção "${id}" em src/content/home.json.`);
  return entry.data;
}

/** Coleção ordenada pelo campo `order`. */
export async function getOrdered<C extends 'problems' | 'services' | 'steps' | 'commitments' | 'faq' | 'founders' | 'cases'>(name: C) {
  const items = await getCollection(name);
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

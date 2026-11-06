// @ts-check
// CONFIGURAÇÃO ÚNICA DA MARCA E DO DOMÍNIO.
// O nome, o domínio e a URL canónica estão só aqui. Tudo o resto (títulos, Open Graph, schema.org,
// sitemap, robots.txt, manifest, rodapé, páginas legais, email do formulário e imagens da marca)
// lê estes valores. Para trocar de nome ou de domínio, editar este ficheiro e correr `npm run build`
// (e `npm run brand` se o nome aparecer nas imagens).

/** Nome comercial (marca). [A CONFIRMAR: registo de marca] */
export const BRAND_NAME = 'FlowOps';

/** Domínio, sem protocolo nem barra final. [A CONFIRMAR: domínio registado] */
export const DOMAIN = 'flowops.pt';

/**
 * URL canónica. Por defeito é https:// + DOMAIN. Só para pré-visualizações (ex.: *.workers.dev) pode ser
 * sobreposta com PUBLIC_SITE_URL no .env ou no build; não é preciso mexer nela para mudar de domínio.
 * @param {string | undefined} [override]
 */
export const siteUrl = (override) => (override || `https://${DOMAIN}`).replace(/\/$/, '');

/**
 * Titulares da atividade: trabalhadores independentes (sem sociedade).
 * Campos vazios aparecem no site como [A CONFIRMAR].
 */
export const OWNERS = [
  { name: 'Lourenço Couto', nif: '' }, // [A CONFIRMAR: NIF]
  { name: 'Pedro Marques', nif: '' }, // [A CONFIRMAR: NIF]
];

/** Morada profissional para as páginas legais. [A CONFIRMAR] */
export const ADDRESS = '';

/** Localidade (usada no schema.org e nos textos). */
export const LOCALITY = { city: 'Lisboa', country: 'Portugal', countryCode: 'PT' };

// Bindings do Worker da Cloudflare usados no código (ver wrangler.jsonc).
declare module 'cloudflare:workers' {
  interface RateLimiter {
    limit(options: { key: string }): Promise<{ success: boolean }>;
  }
  export const env: { CONTACT_LIMITER?: RateLimiter } & Record<string, unknown>;
}

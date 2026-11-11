# Lighthouse 2026-11-11

Build local (scripts/serve-vercel.mjs, sem compressão: em produção a Vercel comprime o HTML e o CSS). 3 corridas por página, conta a mediana da performance. Mínimo pedido: 95.

| Modo | Página | Performance (mediana) | Corridas | Acessibilidade | Boas práticas | SEO | LCP | CLS | TBT |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| telemovel | / | 97 | 97/97/97 | 100 | 100 | 100 | 2,6 s | 0 | 0 ms |
| telemovel | /privacidade | 99 | 99/99/99 | 100 | 100 | 100 | 2,0 s | 0 | 0 ms |
| telemovel | /termos | 99 | 99/99/99 | 100 | 100 | 100 | 2,0 s | 0 | 0 ms |
| computador | / | 100 | 100/100/100 | 100 | 100 | 100 | 0,6 s | 0 | 0 ms |
| computador | /privacidade | 100 | 100/100/100 | 100 | 100 | 100 | 0,4 s | 0 | 0 ms |
| computador | /termos | 100 | 100/100/100 | 100 | 100 | 100 | 0,4 s | 0 | 0 ms |

import { createFileRoute } from "@tanstack/react-router";

import { SITE } from "@/config/site";
import { categoryPath, posts, rootCategories } from "@/lib/catalog";
import { lerConfigServidor, postsPublicadosResumo } from "@/lib/public-db.server";
import { SITE_URL } from "@/lib/seo";

/**
 * /llms.txt — resumo do portal em Markdown para assistentes de IA
 * (ChatGPT, Claude, Perplexity, Gemini). Segue a proposta em llmstxt.org:
 * título, resumo em citação e listas de links para as páginas de referência.
 */
export const Route = createFileRoute("/llms.txt")({
  server: {
    handlers: {
      GET: async () => {
        const [{ modoConstrucao }, postsBanco] = await Promise.all([
          lerConfigServidor(),
          postsPublicadosResumo(),
        ]);
        if (modoConstrucao) {
          return new Response("", { status: 404 });
        }

        const url = (caminho: string) => `${SITE_URL}${caminho}`;

        const listaPosts = new Map<string, { titulo: string; resumo: string }>();
        for (const p of postsBanco) listaPosts.set(p.slug, p);
        for (const p of posts) if (!listaPosts.has(p.slug)) listaPosts.set(p.slug, p);

        const categorias = rootCategories
          .filter((c) => c.ativo !== false)
          .map((c) => `- [${c.nome}](${url(`/catalogo/${categoryPath(c)}`)})`)
          .join("\n");

        const artigos = [...listaPosts.entries()]
          .map(([slug, p]) => `- [${p.titulo}](${url(`/blog/${slug}`)})${p.resumo ? `: ${p.resumo.replace(/\s+/g, " ").trim()}` : ""}`)
          .join("\n");

        const corpo = `# ${SITE.nome}

> Portal de conteúdo e catálogo da ${SITE.nome}, tabacaria e head shop brasileira (Rio de Janeiro, RJ). Reúne guias, comparativos e informações sobre sedas, piteiras, dichavadores, bongs, bandejas, isqueiros, umidificadores Boveda e acessórios para fumantes, além de conteúdo informativo sobre tabaco e legislação brasileira. Conteúdo para maiores de 18 anos. O portal não vende derivados do tabaco pela internet (RDC ANVISA nº 558/2021).

Empresa: ${SITE.razaoSocial}, CNPJ ${SITE.cnpj}. Loja oficial: ${SITE.lojaOficial}. Mercado Livre: ${SITE.mercadoLivre}. Contato: ${SITE.email}.

## Guias e ferramentas
- [Comece aqui: guia para iniciantes](${url("/comece-aqui")}): indica acessórios conforme o nível de experiência (explorador, familiarizado, entusiasta, especialista).
- [Calculadora Boveda](${url("/calculadora-boveda")}): recomenda tamanho, quantidade e % de umidade do Boveda para ervas, flores e charutos.
- [Tabaco: tipos, cura e legislação](${url("/conteudo/tabaco")})
- [Perguntas frequentes](${url("/faq")})

## Artigos
${artigos}

## Catálogo por categoria
${categorias}

## Institucional
- [Quem somos](${url("/quem-somos")})
- [Marcas](${url("/marcas")})
- [Contato](${url("/contato")})
- [Aviso para maiores de 18 anos](${url("/maiores-de-18")})

## Optional
- [Sitemap completo](${url("/sitemap.xml")})
`;

        return new Response(corpo, {
          headers: {
            "content-type": "text/markdown; charset=utf-8",
            "cache-control": "public, max-age=3600",
          },
        });
      },
    },
  },
});

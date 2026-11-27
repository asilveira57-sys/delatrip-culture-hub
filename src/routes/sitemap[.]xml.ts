import { createFileRoute } from "@tanstack/react-router";

import { SITE_URL } from "@/lib/seo";
import { lerConfigServidor, postsPublicadosComData } from "@/lib/public-db.server";
import { brands, categories, categoryPath, posts, products } from "@/lib/catalog";

const ROTAS_FIXAS: [string, number][] = [
  ["/", 1.0],
  ["/catalogo", 0.9],
  ["/marcas", 0.8],
  ["/blog", 0.7],
  ["/acessorios", 0.7],
  ["/comece-aqui", 0.8],
  ["/calculadora-boveda", 0.7],
  ["/comece-aqui/explorador", 0.6],
  ["/comece-aqui/familiarizado", 0.6],
  ["/comece-aqui/entusiasta", 0.6],
  ["/comece-aqui/especialista", 0.6],
  ["/conteudo/tabaco", 0.7],
  ["/quem-somos", 0.6],
  ["/contato", 0.5],
  ["/faq", 0.5],
  ["/politica-de-privacidade", 0.3],
  ["/politica-de-cookies", 0.3],
  ["/lgpd", 0.3],
  ["/termos-de-uso", 0.3],
  ["/maiores-de-18", 0.3],
];

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const [{ modoConstrucao, rotasNoindex, produtosOcultos, produtosIndexaveis }, slugsBanco] =
          await Promise.all([lerConfigServidor(), postsPublicadosComData()]);

        if (modoConstrucao) {
          return new Response(
            `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>\n`,
            { headers: { "content-type": "application/xml; charset=utf-8" } },
          );
        }

        // Posts do banco + posts legados do JSON, sem duplicar slugs.
        // lastmod: data real da última edição (banco) ou da publicação (JSON).
        const datasPosts = new Map<string, string>();
        for (const p of posts) {
          const data = (p as { atualizado?: string }).atualizado ?? p.data;
          if (data) datasPosts.set(p.slug, data.slice(0, 10));
        }
        for (const [slug, data] of slugsBanco) if (data) datasPosts.set(slug, data);
        const slugsPosts = new Set<string>([...slugsBanco.keys(), ...posts.map((p) => p.slug)]);

        // Rotas sem data própria não recebem lastmod (data falsa faz o Google ignorar o campo).
        type Entrada = [string, number, (string | undefined)?];
        const urls: Entrada[] = [
          ...ROTAS_FIXAS.filter(([u]) => !rotasNoindex.has(u)),
          ...categories.map<Entrada>((c) => [`/catalogo/${categoryPath(c)}`, 0.8]),
          ...brands.map<Entrada>((b) => [`/${b.slug}`, 0.6]),
          ...products
            .filter((p) => !produtosOcultos.has(p.slug) && produtosIndexaveis.has(p.slug))
            .map<Entrada>((p) => [`/produto/${p.slug}`, 0.6]),
          ...[...slugsPosts]
            .filter((s) => !rotasNoindex.has(`/blog/${s}`))
            .map<Entrada>((s) => [`/blog/${s}`, 0.5, datasPosts.get(s)]),
        ];

        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
          .map(
            ([u, p, lastmod]) =>
              `  <url>\n    <loc>${SITE_URL}${u === "/" ? "" : u}</loc>\n${
                lastmod ? `    <lastmod>${lastmod}</lastmod>\n` : ""
              }    <priority>${p.toFixed(1)}</priority>\n  </url>`,
          )
          .join("\n")}\n</urlset>\n`;

        return new Response(xml, {
          headers: {
            "content-type": "application/xml; charset=utf-8",
            "cache-control": "public, max-age=300",
          },
        });
      },
    },
  },
});

import { createFileRoute } from "@tanstack/react-router";

import { SITE_URL } from "@/lib/seo";
import { lerConfigServidor } from "@/lib/public-db.server";
import { brands, categories, categoryPath, posts, products } from "@/lib/catalog";

const ROTAS_FIXAS: [string, number][] = [
  ["/", 1.0],
  ["/catalogo", 0.9],
  ["/marcas", 0.8],
  ["/blog", 0.7],
  ["/podcast", 0.7],
  ["/acessorios", 0.7],
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
        const { modoConstrucao, rotasNoindex, produtosOcultos } =
          await lerConfigServidor();

        if (modoConstrucao) {
          return new Response(
            `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>\n`,
            { headers: { "content-type": "application/xml; charset=utf-8" } },
          );
        }

        const urls: [string, number][] = [
          ...ROTAS_FIXAS.filter(([u]) => !rotasNoindex.has(u)),
          ...categories.map<[string, number]>((c) => [
            `/catalogo/${categoryPath(c)}`,
            0.8,
          ]),
          ...brands.map<[string, number]>((b) => [`/${b.slug}`, 0.6]),
          ...products
            .filter((p) => !produtosOcultos.has(p.slug))
            .map<[string, number]>((p) => [`/produto/${p.slug}`, 0.6]),
          ...posts.map<[string, number]>((p) => [`/blog/${p.slug}`, 0.5]),
        ];

        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
          .map(
            ([u, p]) =>
              `  <url>\n    <loc>${SITE_URL}${u === "/" ? "" : u}</loc>\n    <priority>${p.toFixed(1)}</priority>\n  </url>`,
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

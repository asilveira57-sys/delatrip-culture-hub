import { createFileRoute } from "@tanstack/react-router";

import { SITE_URL } from "@/lib/seo";
import { lerConfigServidor } from "@/lib/public-db.server";

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { modoConstrucao } = await lerConfigServidor();

        // Usa a origem real da requisição (domínio próprio, preview ou publicado),
        // caindo para o domínio oficial quando não for possível determiná-la.
        let origem = SITE_URL;
        try {
          origem = new URL(request.url).origin;
        } catch {
          origem = SITE_URL;
        }
        const sitemap = `Sitemap: ${origem}/sitemap.xml\n`;

        const corpo = modoConstrucao
          ? `User-agent: *\nDisallow: /\n\n${sitemap}`
          : `User-agent: Googlebot\nAllow: /\n\nUser-agent: Bingbot\nAllow: /\n\nUser-agent: Twitterbot\nAllow: /\n\nUser-agent: facebookexternalhit\nAllow: /\n\nUser-agent: *\nAllow: /\nDisallow: /admin\n\n${sitemap}`;


        return new Response(corpo, {
          headers: {
            "content-type": "text/plain; charset=utf-8",
            "cache-control": "public, max-age=300",
          },
        });
      },
    },
  },
});

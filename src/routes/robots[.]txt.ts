import { createFileRoute } from "@tanstack/react-router";

import { SITE_URL } from "@/lib/seo";
import { lerConfigServidor } from "@/lib/public-db.server";

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: async () => {
        const { modoConstrucao } = await lerConfigServidor();

        const corpo = modoConstrucao
          ? `User-agent: *\nDisallow: /\n`
          : `User-agent: Googlebot\nAllow: /\n\nUser-agent: Bingbot\nAllow: /\n\nUser-agent: Twitterbot\nAllow: /\n\nUser-agent: facebookexternalhit\nAllow: /\n\nUser-agent: *\nAllow: /\nDisallow: /admin\n\nSitemap: ${SITE_URL}/sitemap.xml\n`;

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

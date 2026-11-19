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

        // Buscadores e robôs de IA liberados de forma explícita (o grupo "*" já
        // os cobriria, mas um grupo nomeado substitui o "*" inteiro — por isso
        // cada grupo repete o Disallow do admin).
        const robos = [
          "Googlebot",
          "Bingbot",
          "Google-Extended",
          "GPTBot",
          "OAI-SearchBot",
          "ChatGPT-User",
          "ClaudeBot",
          "Claude-SearchBot",
          "Claude-User",
          "PerplexityBot",
          "Perplexity-User",
          "Applebot",
          "Applebot-Extended",
          "Twitterbot",
          "facebookexternalhit",
          "*",
        ];
        const corpo = modoConstrucao
          ? `User-agent: *\nDisallow: /\n\n${sitemap}`
          : `${robos
              .map((ua) => `User-agent: ${ua}\nAllow: /\nDisallow: /admin\n`)
              .join("\n")}\n${sitemap}`;

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

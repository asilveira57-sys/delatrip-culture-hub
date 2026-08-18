/** Base pública do site — usada em canonical, og:url, JSON-LD e sitemap. */
export const SITE_URL = "https://delatrip-culture-hub.lovable.app";

export function absoluteUrl(path: string) {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`.replace(/\/$/, "") || SITE_URL;
}

/** Link canônico para o head() de uma rota. */
export function canonical(path: string) {
  return { rel: "canonical" as const, href: absoluteUrl(path) };
}

/** Script JSON-LD para o head() de uma rota. */
export function jsonLd(data: unknown) {
  return {
    type: "application/ld+json",
    children: JSON.stringify(data),
  };
}

export function breadcrumbLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

/**
 * Monta as metatags de uma rota dando prioridade ao que foi salvo no banco
 * (admin > SEO) e caindo para os valores padrão da própria página.
 */
export function metaDaRota(
  seo: { titulo: string | null; descricao: string | null; keywords: string | null; noindex: boolean } | null | undefined,
  padrao: { titulo: string; descricao: string; ogTitulo?: string; ogDescricao?: string; caminho: string },
) {
  const titulo = seo?.titulo?.trim() || padrao.titulo;
  const descricao = seo?.descricao?.trim() || padrao.descricao;
  const keywords = seo?.keywords?.trim();

  return [
    { title: titulo },
    { name: "description", content: descricao },
    ...(keywords ? [{ name: "keywords", content: keywords }] : []),
    ...(seo?.noindex ? [{ name: "robots", content: "noindex, nofollow" }] : []),
    { property: "og:title", content: seo?.titulo?.trim() || padrao.ogTitulo || titulo },
    {
      property: "og:description",
      content: seo?.descricao?.trim() || padrao.ogDescricao || descricao,
    },
    { property: "og:url", content: absoluteUrl(padrao.caminho) },
  ];
}

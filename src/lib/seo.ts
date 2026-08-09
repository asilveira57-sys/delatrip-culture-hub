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

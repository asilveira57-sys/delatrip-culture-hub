import { imageForKey, posts as postsJson } from "@/lib/editorial";
import { sanitizarHtml } from "@/lib/sanitize";

export const CATEGORIAS_POST = [
  "Cultura",
  "Guias & Como Escolher",
  "Marcas",
  "Tabaco",
  "Legislação",
  "Novidades",
] as const;

export type PostPublico = {
  slug: string;
  titulo: string;
  resumo: string;
  conteudoHtml: string;
  capaUrl: string | null;
  capaAlt: string | null;
  categoria: string;
  autor: string | null;
  data: string;
  seoTitulo: string | null;
  seoDescricao: string | null;
  seoKeywords: string | null;
  ogTitulo: string | null;
  ogDescricao: string | null;
  ogImagemUrl: string | null;
  ogImagemAlt: string | null;
  twitterCard: string;
};

/** Converte o markdown simples dos posts legados em HTML. */
export function markdownSimplesParaHtml(texto: string) {
  return texto
    .split("\n\n")
    .map((bloco) => bloco.trim())
    .filter(Boolean)
    .map((bloco) => (bloco.startsWith("## ") ? `<h2>${bloco.slice(3)}</h2>` : `<p>${bloco}</p>`))
    .join("");
}

type LinhaPost = {
  slug: string;
  titulo: string;
  resumo: string | null;
  conteudo_html: string | null;
  capa_url: string | null;
  capa_alt: string | null;
  categoria: string | null;
  autor: string | null;
  publicado_em: string | null;
  created_at?: string;
  seo_titulo?: string | null;
  seo_descricao?: string | null;
  seo_keywords?: string | null;
  og_titulo?: string | null;
  og_descricao?: string | null;
  og_imagem_url?: string | null;
  og_imagem_alt?: string | null;
  twitter_card?: string | null;
};

export function mapearPost(linha: LinhaPost): PostPublico {
  return {
    slug: linha.slug,
    titulo: linha.titulo,
    resumo: linha.resumo ?? "",
    conteudoHtml: sanitizarHtml(linha.conteudo_html),
    capaUrl: linha.capa_url,
    capaAlt: linha.capa_alt,
    categoria: linha.categoria ?? "Cultura",
    autor: linha.autor,
    data: (linha.publicado_em ?? linha.created_at ?? "").slice(0, 10),
    seoTitulo: linha.seo_titulo ?? null,
    seoDescricao: linha.seo_descricao ?? null,
    seoKeywords: linha.seo_keywords ?? null,
    ogTitulo: linha.og_titulo ?? null,
    ogDescricao: linha.og_descricao ?? null,
    ogImagemUrl: linha.og_imagem_url ?? null,
    ogImagemAlt: linha.og_imagem_alt ?? null,
    twitterCard: linha.twitter_card ?? "summary_large_image",
  };
}

/** Fallback: o blog continua no ar lendo o JSON caso o banco falhe. */
export function postsFallback(): PostPublico[] {
  return postsJson.map((p) => ({
    slug: p.slug,
    titulo: p.titulo,
    resumo: p.resumo,
    conteudoHtml: markdownSimplesParaHtml(p.conteudo),
    capaUrl: `asset:${p.imagem}`,
    capaAlt: p.titulo,
    categoria: p.categoria,
    autor: "DeLaTrip",
    data: p.data,
    seoTitulo: null,
    seoDescricao: null,
    seoKeywords: null,
    ogTitulo: null,
    ogDescricao: null,
    ogImagemUrl: null,
    ogImagemAlt: null,
    twitterCard: "summary_large_image",
  }));
}

export const CAMPOS_POST =
  "slug, titulo, resumo, conteudo_html, capa_url, capa_alt, categoria, autor, publicado_em, created_at, seo_titulo, seo_descricao, seo_keywords, og_titulo, og_descricao, og_imagem_url, og_imagem_alt, twitter_card";

/** Resolve a capa: "asset:chave" usa as imagens locais; o resto é URL direta. */
export function resolverCapa(capaUrl: string | null | undefined, chaveFallback = "sedas") {
  if (!capaUrl) return imageForKey(chaveFallback);
  return capaUrl.startsWith("asset:") ? imageForKey(capaUrl.slice(6)) : capaUrl;
}

/** Categorias tratadas como notícia (geram NewsArticle em vez de Article). */
const CATEGORIAS_NOTICIA = ["novidades", "noticias", "notícias", "marcas", "legislação", "legislacao"];

export function tipoSchemaDoPost(categoria: string | null | undefined) {
  return CATEGORIAS_NOTICIA.includes((categoria ?? "").trim().toLowerCase())
    ? "NewsArticle"
    : "Article";
}

/** Dados estruturados Article/NewsArticle gerados a partir do post. */
export function artigoLd(
  post: PostPublico,
  opcoes: { url: string; imagem?: string | null },
) {
  const keywords = (post.seoKeywords ?? "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
  return {
    "@context": "https://schema.org",
    "@type": tipoSchemaDoPost(post.categoria),
    headline: (post.seoTitulo ?? post.titulo).slice(0, 110),
    description: post.seoDescricao ?? post.resumo,
    ...(opcoes.imagem ? { image: [opcoes.imagem] } : {}),
    ...(post.data ? { datePublished: post.data, dateModified: post.data } : {}),
    ...(keywords.length ? { keywords } : {}),
    articleSection: post.categoria,
    inLanguage: "pt-BR",
    author: { "@type": "Organization", name: post.autor ?? "DeLaTrip" },
    publisher: { "@type": "Organization", name: "DeLaTrip" },
    mainEntityOfPage: { "@type": "WebPage", "@id": opcoes.url },
    isAccessibleForFree: true,
  };
}

import { createFileRoute, Link } from "@tanstack/react-router";

import { absoluteUrl, breadcrumbLd, canonical, jsonLd } from "@/lib/seo";

import { ArtigoConteudo } from "@/components/ArtigoConteudo";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Curtir } from "@/components/Curtir";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { resolverCapa } from "@/lib/blog-core";
import { obterPostPublico } from "@/lib/blog.functions";
import { formatDate } from "@/lib/editorial";

export const Route = createFileRoute("/blog/$slug")({
  loader: ({ params }) => obterPostPublico({ data: { slug: params.slug } }),
  head: ({ params, loaderData }) => {
    const post = loaderData ?? null;
    const titulo = post
      ? (post.seoTitulo ?? `${post.titulo} — Blog DeLaTrip`)
      : "Post não encontrado — DeLaTrip";
    const descricao = post
      ? (post.seoDescricao ?? post.resumo)
      : "Este conteúdo não está disponível.";
    return {
      meta: [
        { title: titulo },
        { name: "description", content: descricao },
        ...(post?.seoKeywords ? [{ name: "keywords", content: post.seoKeywords }] : []),
        ...(post ? [] : [{ name: "robots", content: "noindex" }]),
        { property: "og:title", content: titulo },
        { property: "og:description", content: descricao },
        { property: "og:type", content: "article" },
        { property: "og:url", content: absoluteUrl(`/blog/${params.slug}`) },
      ],
      links: [canonical(`/blog/${params.slug}`)],
      scripts: post
        ? [
            jsonLd({
              "@context": "https://schema.org",
              "@type": "Article",
              headline: post.titulo,
              description: post.resumo,
              datePublished: post.data,
              articleSection: post.categoria,
              author: { "@type": "Organization", name: post.autor ?? "DeLaTrip" },
              publisher: { "@type": "Organization", name: "DeLaTrip" },
              mainEntityOfPage: absoluteUrl(`/blog/${post.slug}`),
            }),
            jsonLd(
              breadcrumbLd([
                { name: "Início", path: "/" },
                { name: "Blog", path: "/blog" },
                { name: post.titulo, path: `/blog/${post.slug}` },
              ]),
            ),
          ]
        : [],
    };
  },
  errorComponent: () => (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <p className="text-muted-foreground">Não foi possível carregar este post agora.</p>
    </div>
  ),
  component: PostPage,
});

function PostPage() {
  const post = Route.useLoaderData();

  if (!post) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16">
        <EmptyState
          titulo="Post não encontrado"
          acao={
            <Button asChild>
              <Link to="/blog">Voltar ao blog</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <Breadcrumb items={[{ label: "Blog", to: "/blog" }, { label: post.titulo }]} />
      <p className="eyebrow text-primary">{post.categoria}</p>
      <h1 className="mt-2 text-3xl font-bold uppercase sm:text-4xl">{post.titulo}</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        {formatDate(post.data)}
        {post.autor ? ` · ${post.autor}` : ""}
      </p>
      <img
        src={resolverCapa(post.capaUrl)}
        alt={post.capaAlt ?? post.titulo}
        loading="lazy"
        width={1024}
        height={1024}
        className="mt-8 aspect-[16/9] w-full rounded-lg border border-border bg-ink object-cover"
      />
      {post.resumo ? (
        <p className="mt-8 text-lg leading-relaxed text-muted-foreground">{post.resumo}</p>
      ) : null}
      <ArtigoConteudo html={post.conteudoHtml} className="mt-6" />

      <div className="mt-10 border-t border-border pt-6">
        <Curtir tipo="post" alvo={post.slug} />
      </div>
    </article>
  );
}

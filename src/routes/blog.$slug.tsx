import { createFileRoute, Link } from "@tanstack/react-router";

import { absoluteUrl, breadcrumbLd, canonical, jsonLd } from "@/lib/seo";

import { Breadcrumb } from "@/components/Breadcrumb";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { formatDate, getPost, imageForKey } from "@/lib/catalog";

export const Route = createFileRoute("/blog/$slug")({
  head: ({ params }) => {
    const post = getPost(params.slug);
    const titulo = post ? `${post.titulo} — Blog DeLaTrip` : "Post não encontrado — DeLaTrip";
    const descricao = post?.resumo ?? "Este conteúdo não está disponível.";
    return {
      meta: [
        { title: titulo },
        { name: "description", content: descricao },
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
              author: { "@type": "Organization", name: "DeLaTrip" },
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
  component: PostPage,
});

function PostPage() {
  const { slug } = Route.useParams();
  const post = getPost(slug);

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
      <p className="mt-3 text-sm text-muted-foreground">{formatDate(post.data)}</p>
      <img
        src={imageForKey(post.imagem)}
        alt={post.titulo}
        loading="lazy"
        width={1024}
        height={1024}
        className="mt-8 aspect-[16/9] w-full rounded-lg border border-border bg-ink object-cover"
      />
      <p className="mt-8 text-lg leading-relaxed text-muted-foreground">{post.resumo}</p>
      <div className="mt-6 space-y-4">
        {post.conteudo.split("\n\n").map((paragrafo, i) =>
          paragrafo.startsWith("## ") ? (
            <h2 key={i} className="pt-4 text-xl font-semibold uppercase">
              {paragrafo.slice(3)}
            </h2>
          ) : (
            <p key={i} className="leading-relaxed">
              {paragrafo}
            </p>
          ),
        )}
      </div>
    </article>
  );
}

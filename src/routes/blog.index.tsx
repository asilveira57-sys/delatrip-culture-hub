import { createFileRoute } from "@tanstack/react-router";

import { absoluteUrl, canonical } from "@/lib/seo";

import { PageHeader } from "@/components/PageHeader";
import { PostCard } from "@/components/PostCard";
import { listarPostsPublicos } from "@/lib/blog.functions";

export const Route = createFileRoute("/blog/")({
  loader: () => listarPostsPublicos(),
  head: () => ({
    meta: [
      { title: "Blog — guias e conteúdo da tabacaria | DeLaTrip" },
      {
        name: "description",
        content:
          "Guias, comparativos e manutenção: conteúdo prático sobre sedas, dichavadores, vidros e tabacos.",
      },
      { property: "og:title", content: "Blog — guias e conteúdo da tabacaria | DeLaTrip" },
      {
        property: "og:description",
        content: "Conteúdo prático sobre sedas, dichavadores, vidros e tabacos.",
      },
      { property: "og:url", content: absoluteUrl("/blog") },
    ],
    links: [canonical("/blog")],
  }),
  errorComponent: () => (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <p className="text-muted-foreground">Não foi possível carregar o blog agora.</p>
    </div>
  ),
  component: BlogPage,
});

function BlogPage() {
  const posts = Route.useLoaderData();

  return (
    <>
      <PageHeader
        eyebrow="Conteúdo"
        titulo="Blog"
        descricao="O que a gente aprende no balcão, escrito para quem quer entender o segmento."
        crumbs={[{ label: "Blog" }]}
      />
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {posts.map((p) => (
            <PostCard key={p.slug} post={p} />
          ))}
        </div>
      </div>
    </>
  );
}

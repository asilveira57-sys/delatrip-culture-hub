import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/PageHeader";
import { PostCard } from "@/components/PostCard";
import { posts } from "@/lib/catalog";

export const Route = createFileRoute("/blog/")({
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
    ],
  }),
  component: BlogPage,
});

function BlogPage() {
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

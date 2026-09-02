import { createFileRoute } from "@tanstack/react-router";

import { canonical, metaDaRota } from "@/lib/seo";

import { PageHeader } from "@/components/PageHeader";
import { PostCard } from "@/components/PostCard";
import { ArtigoConteudo } from "@/components/ArtigoConteudo";
import { listarPostsPublicos } from "@/lib/blog.functions";
import { rich, texto } from "@/lib/paginas-core";
import { carregarPagina } from "@/lib/paginas.functions";

export const Route = createFileRoute("/blog/")({
  loader: async () => {
    const [posts, pagina] = await Promise.all([
      listarPostsPublicos(),
      carregarPagina({ data: { caminho: "/blog" } }),
    ]);
    return { posts, pagina };
  },
  head: ({ loaderData }) => ({
    meta: [
      ...metaDaRota(loaderData?.pagina?.seo, {
        titulo: "Blog — guias e conteúdo da tabacaria | DeLaTrip",
        descricao:
          "Guias, comparativos e manutenção: conteúdo prático sobre sedas, dichavadores, vidros e tabacos.",
        ogDescricao: "Conteúdo prático sobre sedas, dichavadores, vidros e tabacos.",
        caminho: "/blog",
      }),
      { property: "og:type", content: "website" },
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
  const { posts, pagina } = Route.useLoaderData();
  const blocos = pagina?.blocos ?? null;
  const intro = rich(blocos, "intro");

  return (
    <>
      <PageHeader
        eyebrow="Conteúdo"
        titulo={texto(blocos, "titulo", "Blog")}
        descricao={texto(
          blocos,
          "subtitulo",
          "O que a gente aprende no balcão, escrito para quem quer entender o segmento.",
        )}
        crumbs={[{ label: "Blog" }]}
      />
      <div className="mx-auto max-w-6xl px-4 py-12">
        {intro ? <ArtigoConteudo html={intro} className="mb-10 max-w-3xl" /> : null}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {posts.map((p) => (
            <PostCard key={p.slug} post={p} />
          ))}
        </div>
      </div>
    </>
  );
}

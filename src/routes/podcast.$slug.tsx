import { createFileRoute, Link, notFound } from "@tanstack/react-router";

import { ArtigoConteudo } from "@/components/ArtigoConteudo";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { carregarEpisodio } from "@/lib/portal.functions";
import { absoluteUrl, breadcrumbLd, canonical, jsonLd } from "@/lib/seo";

export const Route = createFileRoute("/podcast/$slug")({
  loader: async ({ params }) => {
    const episodio = await carregarEpisodio({ data: { slug: params.slug } });
    if (!episodio) throw notFound();
    return { episodio };
  },
  head: ({ params, loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Episódio não encontrado | DelaTrip" }, { name: "robots", content: "noindex" }],
      };
    }
    const ep = loaderData.episodio;
    const titulo = ep.seo_titulo || `${ep.titulo} | Podcast DelaTrip`;
    const descricao =
      ep.seo_descricao || ep.resumo || ep.descricao || "Episódio do podcast DelaTrip.";
    return {
      meta: [
        { title: titulo },
        { name: "description", content: descricao },
        ...(ep.seo_keywords ? [{ name: "keywords", content: ep.seo_keywords }] : []),
        { property: "og:title", content: titulo },
        { property: "og:description", content: descricao },
        { property: "og:type", content: "article" },
        { property: "og:url", content: absoluteUrl(`/podcast/${params.slug}`) },
        ...(ep.og_imagem || ep.capa_url
          ? [
              { property: "og:image", content: (ep.og_imagem || ep.capa_url) as string },
              { name: "twitter:image", content: (ep.og_imagem || ep.capa_url) as string },
              { name: "twitter:card", content: "summary_large_image" },
            ]
          : []),
      ],
      links: [canonical(`/podcast/${params.slug}`)],
      scripts: [
        jsonLd({
          "@context": "https://schema.org",
          "@type": "PodcastEpisode",
          name: ep.titulo,
          url: absoluteUrl(`/podcast/${params.slug}`),
          datePublished: ep.data_publicacao,
          description: descricao,
          ...(ep.duracao ? { timeRequired: ep.duracao } : {}),
        }),
        jsonLd(
          breadcrumbLd([
            { name: "Início", path: "/" },
            { name: "Podcast", path: "/podcast" },
            { name: ep.titulo, path: `/podcast/${params.slug}` },
          ]),
        ),
      ],
    };
  },
  notFoundComponent: EpisodioNaoEncontrado,
  component: EpisodioPage,
});

function EpisodioNaoEncontrado() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 text-center">
      <h1 className="text-2xl font-semibold uppercase">Episódio não encontrado</h1>
      <Button asChild className="mt-6">
        <Link to="/podcast">Ver todos os episódios</Link>
      </Button>
    </div>
  );
}

function EpisodioPage() {
  const { episodio: ep } = Route.useLoaderData();
  const links = [
    ep.spotify_url ? { rotulo: "Ouvir no Spotify", url: ep.spotify_url } : null,
    ep.youtube_url ? { rotulo: "Assistir no YouTube", url: ep.youtube_url } : null,
    ep.outro_url ? { rotulo: "Outra plataforma", url: ep.outro_url } : null,
  ].filter(Boolean) as { rotulo: string; url: string }[];

  return (
    <>
      <PageHeader
        eyebrow="Podcast"
        titulo={ep.titulo}
        {...(ep.resumo ? { descricao: ep.resumo } : {})}
        crumbs={[{ label: "Podcast", to: "/podcast" }, { label: ep.titulo }]}
      />
      <article className="mx-auto max-w-3xl px-4 py-14">
        {ep.capa_url ? (
          <img
            src={ep.capa_url}
            alt={ep.capa_alt ?? `Capa do episódio ${ep.titulo}`}
            className="mb-8 w-full rounded-lg object-cover"
          />
        ) : null}

        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          {ep.data_publicacao
            ? new Date(ep.data_publicacao).toLocaleDateString("pt-BR")
            : null}
          {ep.duracao ? ` · ${ep.duracao}` : ""}
          {ep.participantes ? ` · ${ep.participantes}` : ""}
        </p>

        {links.length > 0 ? (
          <div className="mt-6 flex flex-wrap gap-3">
            {links.map((l) => (
              <Button key={l.url} asChild variant="outline">
                <a href={l.url} target="_blank" rel="noopener noreferrer">
                  {l.rotulo}
                </a>
              </Button>
            ))}
          </div>
        ) : null}

        {ep.conteudo_html ? (
          <div className="mt-8">
            <ArtigoConteudo html={ep.conteudo_html} />
          </div>
        ) : ep.descricao ? (
          <p className="mt-8 leading-relaxed text-muted-foreground">{ep.descricao}</p>
        ) : null}

        {ep.transcricao ? (
          <details className="mt-10 rounded-lg border border-border p-4">
            <summary className="cursor-pointer text-sm font-medium">Transcrição</summary>
            <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {ep.transcricao}
            </p>
          </details>
        ) : null}
      </article>
    </>
  );
}

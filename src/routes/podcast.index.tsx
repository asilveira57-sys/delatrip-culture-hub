import { createFileRoute, Link } from "@tanstack/react-router";

import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { listarEpisodios } from "@/lib/portal.functions";
import { absoluteUrl, breadcrumbLd, canonical, jsonLd } from "@/lib/seo";

export const Route = createFileRoute("/podcast/")({
  loader: () => listarEpisodios(),
  head: () => ({
    meta: [
      { title: "Podcast DelaTrip | Cultura e repertório" },
      {
        name: "description",
        content:
          "Episódios do podcast da DelaTrip: conversas sobre cultura, marcas, curadoria e o universo head shop brasileiro.",
      },
      { property: "og:title", content: "Podcast DelaTrip" },
      {
        property: "og:description",
        content: "Conversas sobre cultura, marcas e curadoria da cena brasileira.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: absoluteUrl("/podcast") },
    ],
    links: [canonical("/podcast")],
    scripts: [
      jsonLd(
        breadcrumbLd([
          { name: "Início", path: "/" },
          { name: "Podcast", path: "/podcast" },
        ]),
      ),
    ],
  }),
  component: PodcastIndex,
});

function PodcastIndex() {
  const episodios = Route.useLoaderData();

  return (
    <>
      <PageHeader
        eyebrow="Conteúdo"
        titulo="Podcast DelaTrip"
        descricao="Conversas sobre cultura, marcas e repertório."
        crumbs={[{ label: "Podcast" }]}
      />
      <div className="mx-auto max-w-5xl px-4 py-14">
        {episodios.length === 0 ? (
          <EmptyState
            titulo="Em breve"
            descricao="Os primeiros episódios estão sendo produzidos. Volte em breve."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {episodios.map((ep) => (
              <article
                key={ep.slug}
                className="overflow-hidden rounded-lg border border-border bg-card"
              >
                {ep.capa_url ? (
                  <img
                    src={ep.capa_url}
                    alt={ep.capa_alt ?? `Capa do episódio ${ep.titulo}`}
                    loading="lazy"
                    className="aspect-video w-full object-cover"
                  />
                ) : null}
                <div className="p-5">
                  <h2 className="text-lg font-semibold uppercase">
                    <Link
                      to="/podcast/$slug"
                      params={{ slug: ep.slug }}
                      className="hover:text-primary"
                    >
                      {ep.titulo}
                    </Link>
                  </h2>
                  <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                    {ep.resumo ?? ep.descricao ?? ""}
                  </p>
                  <p className="mt-3 text-xs uppercase tracking-wide text-muted-foreground">
                    {ep.data_publicacao
                      ? new Date(ep.data_publicacao).toLocaleDateString("pt-BR")
                      : null}
                    {ep.duracao ? ` · ${ep.duracao}` : ""}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

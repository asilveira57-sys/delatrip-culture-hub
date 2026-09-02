import { createFileRoute } from "@tanstack/react-router";

import { absoluteUrl, canonical, metaDaRota } from "@/lib/seo";

import { BrandCard } from "@/components/BrandCard";
import { PageHeader } from "@/components/PageHeader";
import { ArtigoConteudo } from "@/components/ArtigoConteudo";
import { marcasEfetivas, useMarcaOverlays } from "@/lib/marcas";
import { rich, texto } from "@/lib/paginas-core";
import { carregarPagina } from "@/lib/paginas.functions";

export const Route = createFileRoute("/marcas/")({
  loader: () => carregarPagina({ data: { caminho: "/marcas" } }),
  head: ({ loaderData }) => ({
    meta: [
      ...metaDaRota(loaderData?.seo, {
        titulo: "Marcas — DeLaTrip",
        descricao:
          "Conheça as marcas que a DeLaTrip trabalha: Smoking, RAW, OCB, Elements, Clipper, BIC e produção nacional.",
        ogDescricao: "Clássicos internacionais e marcas brasileiras da tabacaria.",
        caminho: "/marcas",
      }),
      { property: "og:type", content: "website" },
    ],
    links: [canonical("/marcas")],
  }),
  component: MarcasPage,
});

function MarcasPage() {
  const { blocos } = Route.useLoaderData();
  const overlays = useMarcaOverlays();
  const marcas = marcasEfetivas(overlays);
  const intro = rich(blocos, "intro");
  return (
    <>
      <PageHeader
        eyebrow="Curadoria"
        titulo={texto(blocos, "titulo", "Marcas")}
        descricao={texto(
          blocos,
          "subtitulo",
          "Trabalhamos somente com fabricantes reconhecidos e distribuidores autorizados.",
        )}
        crumbs={[{ label: "Marcas" }]}
      />
      <div className="mx-auto max-w-6xl px-4 py-12">
        {intro ? <ArtigoConteudo html={intro} className="mb-10 max-w-3xl" /> : null}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {marcas.map((m) => (
            <BrandCard key={m.slug} marca={m} />
          ))}
        </div>
      </div>
    </>
  );
}

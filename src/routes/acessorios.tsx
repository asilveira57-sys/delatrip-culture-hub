import { createFileRoute } from "@tanstack/react-router";

import { rich, texto } from "@/lib/paginas-core";
import { carregarPagina } from "@/lib/paginas.functions";

import { absoluteUrl, canonical } from "@/lib/seo";

import { CategoryCard } from "@/components/CategoryCard";
import { ArtigoConteudo } from "@/components/ArtigoConteudo";
import { PageHeader } from "@/components/PageHeader";
import { SectionHeading } from "@/components/SectionHeading";
import { rootCategories } from "@/lib/catalog";

export const Route = createFileRoute("/acessorios")({
  loader: () => carregarPagina({ data: { caminho: "/acessorios" } }),
  head: () => ({
    meta: [
      { title: "Acessórios — hub editorial | DeLaTrip" },
      {
        name: "description",
        content:
          "Dichavadores, bandejas, piteiras, isqueiros e cuidados: um guia dos acessórios que compõem a tabacaria.",
      },
      { property: "og:title", content: "Acessórios — hub editorial | DeLaTrip" },
      {
        property: "og:description",
        content: "Guia dos acessórios que compõem a tabacaria brasileira.",
      },
      { property: "og:url", content: absoluteUrl("/acessorios") },
    ],
    links: [canonical("/acessorios")],
  }),
  component: AcessoriosPage,
});

const blocos = [
  {
    titulo: "Dichavadores",
    texto:
      "O corte uniforme muda a queima. Alumínio usinado dura mais e mantém os dentes afiados; acrílico é leve e barato para levar na mochila.",
  },
  {
    titulo: "Bandejas",
    texto:
      "Mais do que estética: mantêm tudo em um só lugar e evitam desperdício. Metal é fácil de limpar, madeira envelhece bonito.",
  },
  {
    titulo: "Piteiras e filtros",
    texto:
      "Papel é descartável e prático; vidro é reutilizável e preserva melhor o sabor. Filtros de carvão reduzem alcatrão e resfriam a fumaça.",
  },
  {
    titulo: "Isqueiros e maçaricos",
    texto:
      "Recarregáveis reduzem descarte e custam menos no longo prazo. Maçaricos são obrigatórios para peças de vidro e concentrados.",
  },
];

function AcessoriosPage() {
  const blocosPagina = Route.useLoaderData();
  const intro = rich(blocosPagina, "intro");

  return (
    <>
      <PageHeader
        eyebrow="Hub editorial"
        titulo={texto(blocosPagina, "titulo", "Acessórios")}
        descricao="O que cada peça faz, quando faz diferença e como escolher com critério."
        crumbs={[{ label: "Acessórios" }]}
      />
      <div className="mx-auto max-w-6xl px-4 py-12">
        {intro ? <ArtigoConteudo html={intro} className="mb-10 max-w-3xl" /> : null}
        <div className="grid gap-6 md:grid-cols-2">
          {blocos.map((b) => (
            <section key={b.titulo} className="rounded-lg border border-border bg-card p-6">
              <h2 className="text-xl font-semibold uppercase">{b.titulo}</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{b.texto}</p>
            </section>
          ))}
        </div>

        <div className="mt-16">
          <SectionHeading eyebrow="No catálogo" titulo="Navegue por categoria" />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {rootCategories.map((c) => (
              <CategoryCard key={c.id} categoria={c} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

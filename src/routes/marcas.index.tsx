import { createFileRoute } from "@tanstack/react-router";

import { BrandCard } from "@/components/BrandCard";
import { PageHeader } from "@/components/PageHeader";
import { brands } from "@/lib/catalog";

export const Route = createFileRoute("/marcas/")({
  head: () => ({
    meta: [
      { title: "Marcas — DeLaTrip" },
      {
        name: "description",
        content:
          "Conheça as marcas que a DeLaTrip trabalha: Smoking, RAW, OCB, Elements, Clipper, BIC e produção nacional.",
      },
      { property: "og:title", content: "Marcas — DeLaTrip" },
      {
        property: "og:description",
        content: "Clássicos internacionais e marcas brasileiras da tabacaria.",
      },
    ],
  }),
  component: MarcasPage,
});

function MarcasPage() {
  return (
    <>
      <PageHeader
        eyebrow="Curadoria"
        titulo="Marcas"
        descricao="Trabalhamos somente com fabricantes reconhecidos e distribuidores autorizados."
        crumbs={[{ label: "Marcas" }]}
      />
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {brands.map((m) => (
            <BrandCard key={m.slug} marca={m} />
          ))}
        </div>
      </div>
    </>
  );
}

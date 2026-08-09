import { createFileRoute, Link } from "@tanstack/react-router";

import { absoluteUrl, canonical } from "@/lib/seo";

import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { AVISO_SANITARIO } from "@/config/site";

export const Route = createFileRoute("/tabacos")({
  head: () => ({
    meta: [
      { title: "Tabacos — guia educativo | DeLaTrip" },
      {
        name: "description",
        content:
          "Virginia, Burley, Orientais e blends: entenda os tipos de tabaco, curas e usos em cachimbo, narguilé e enrolar.",
      },
      { property: "og:title", content: "Tabacos — guia educativo | DeLaTrip" },
      {
        property: "og:description",
        content: "Tipos de tabaco, curas e usos explicados de forma direta.",
      },
      { property: "og:url", content: absoluteUrl("/tabacos") },
    ],
    links: [canonical("/tabacos")],
  }),
  component: TabacosPage,
});

const tipos = [
  { nome: "Virginia", texto: "Cura a ar quente, sabor adocicado e leve. Base da maioria dos blends." },
  { nome: "Burley", texto: "Cura ao ar, mais seco e neutro. Absorve muito bem aromatizantes." },
  { nome: "Oriental", texto: "Folhas pequenas e condimentadas, usadas em pequenas proporções." },
  { nome: "Kentucky", texto: "Cura por defumação, notas amadeiradas e força elevada." },
  { nome: "Perique", texto: "Fermentado sob pressão, apimentado e usado como condimento." },
  { nome: "Melaço (narguilé)", texto: "Folha macerada em melaço e glicerina, com aromatização intensa." },
];

function TabacosPage() {
  return (
    <>
      <PageHeader
        eyebrow="Educativo"
        titulo="Tabacos"
        descricao="Um panorama das variedades mais usadas e do que muda entre elas."
        crumbs={[{ label: "Tabacos" }]}
      />
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {tipos.map((t) => (
            <section key={t.nome} className="rounded-lg border border-border bg-card p-6">
              <h2 className="text-lg font-semibold uppercase">{t.nome}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t.texto}</p>
            </section>
          ))}
        </div>

        <div className="mt-12 rounded-lg border border-gold/50 bg-gold/10 p-6">
          <h2 className="eyebrow text-gold-foreground">Advertência</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{AVISO_SANITARIO}</p>
        </div>

        <div className="mt-10">
          <Button asChild>
            <Link to="/catalogo/$" params={{ _splat: "tabacos" }}>
              Ver tabacos no catálogo
            </Link>
          </Button>
        </div>
      </div>
    </>
  );
}

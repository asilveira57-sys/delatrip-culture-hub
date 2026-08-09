import { createFileRoute } from "@tanstack/react-router";

import { absoluteUrl, canonical } from "@/lib/seo";

import { PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/legal/termos")({
  head: () => ({
    meta: [
      { title: "Termos de uso — DeLaTrip" },
      {
        name: "description",
        content:
          "Regras de uso do portal institucional DeLaTrip, propriedade intelectual e limitações de responsabilidade.",
      },
      { property: "og:title", content: "Termos de uso — DeLaTrip" },
      { property: "og:description", content: "Regras de uso, propriedade intelectual e responsabilidades." },
      { property: "og:url", content: absoluteUrl("/legal/termos") },
    ],
    links: [canonical("/legal/termos")],
  }),
  component: Termos,
});

function Termos() {
  return (
    <>
      <PageHeader eyebrow="Legal" titulo="Termos de uso" crumbs={[{ label: "Termos de uso" }]} />
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h2 className="text-2xl font-semibold uppercase">Aceitação</h2>
        <p className="mt-3 leading-relaxed text-muted-foreground">
          Ao navegar por este portal, você declara ser maior de 18 anos e
          concorda com estes termos.
        </p>

        <h2 className="mt-10 text-2xl font-semibold uppercase">Conteúdo e catálogo</h2>
        <p className="mt-3 leading-relaxed text-muted-foreground">
          As informações de produtos têm caráter ilustrativo. Especificações,
          disponibilidade e preços podem variar na loja oficial e nos
          marketplaces, que prevalecem sobre o que é exibido aqui.
        </p>

        <h2 className="mt-10 text-2xl font-semibold uppercase">Propriedade intelectual</h2>
        <p className="mt-3 leading-relaxed text-muted-foreground">
          Marca, textos, imagens e demais elementos são protegidos por lei. As
          marcas de terceiros pertencem aos respectivos titulares.
        </p>

        <h2 className="mt-10 text-2xl font-semibold uppercase">Limitação de responsabilidade</h2>
        <p className="mt-3 leading-relaxed text-muted-foreground">
          A DeLaTrip não se responsabiliza pelo uso indevido dos produtos
          apresentados nem por conteúdos de sites de terceiros acessados a partir
          daqui.
        </p>
      </div>
    </>
  );
}

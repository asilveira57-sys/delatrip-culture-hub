import { createFileRoute } from "@tanstack/react-router";

import { absoluteUrl, canonical } from "@/lib/seo";

import { ArtigoConteudo } from "@/components/ArtigoConteudo";
import { PageHeader } from "@/components/PageHeader";
import { SITE } from "@/config/site";
import { rich, texto } from "@/lib/paginas-core";
import { carregarPagina } from "@/lib/paginas.functions";

export const Route = createFileRoute("/sobre")({
  loader: () => carregarPagina({ data: { caminho: "/sobre" } }),
  head: () => ({
    meta: [
      { title: "Sobre a DeLaTrip — tabacaria e head shop" },
      {
        name: "description",
        content:
          "Quem somos, o que fazemos e por que a curadoria de produtos originais é o centro do trabalho da DeLaTrip.",
      },
      { property: "og:title", content: "Sobre a DeLaTrip — tabacaria e head shop" },
      {
        property: "og:description",
        content: "Curadoria, atendimento especializado e cultura da tabacaria brasileira.",
      },
      { property: "og:url", content: absoluteUrl("/sobre") },
    ],
    links: [canonical("/sobre")],
  }),
  component: SobrePage,
});

function SobrePage() {
  const blocos = Route.useLoaderData();
  const corpo = rich(blocos, "corpo");

  return (
    <>
      <PageHeader
        eyebrow="Institucional"
        titulo={texto(blocos, "titulo", "Sobre a DeLaTrip")}
        descricao="Uma tabacaria brasileira construída em torno de curadoria, originalidade e informação."
        crumbs={[{ label: "Sobre" }]}
      />
      <div className="mx-auto max-w-3xl px-4 py-12">
        {corpo ? <ArtigoConteudo html={corpo} /> : (
          <>
        <p className="leading-relaxed">
          A DeLaTrip nasceu do balcão: do contato diário com quem procura o papel
          certo, o dichavador que dura e a peça de vidro bem acabada. Esse
          convívio moldou nossa forma de selecionar produtos — pouca coisa, bem
          escolhida, sempre original.
        </p>
        <h2 className="mt-10 text-2xl font-semibold uppercase">O que fazemos</h2>
        <p className="mt-3 leading-relaxed text-muted-foreground">
          Reunimos marcas internacionais consagradas e produção nacional de alto
          padrão, além de produzir conteúdo educativo sobre o segmento. Este
          portal é institucional: as compras acontecem na loja oficial e nos
          marketplaces onde estamos presentes.
        </p>
        <h2 className="mt-10 text-2xl font-semibold uppercase">Compromisso</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed text-muted-foreground">
          <li>Produtos originais, com procedência verificada.</li>
          <li>Informação clara sobre uso, materiais e manutenção.</li>
          <li>Venda estritamente proibida para menores de 18 anos.</li>
        </ul>
          </>
        )}
        <p className="mt-10 text-sm text-muted-foreground">
          {SITE.endereco} · CNPJ {SITE.cnpj}
        </p>
      </div>
    </>
  );
}

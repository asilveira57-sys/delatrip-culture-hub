import { createFileRoute, Link } from "@tanstack/react-router";

import { LegalLayout } from "@/components/LegalLayout";
import { carregarDocumentoLegal } from "@/lib/portal.functions";
import { AVISO_SANITARIO } from "@/config/site";
import { absoluteUrl, breadcrumbLd, canonical, jsonLd } from "@/lib/seo";

export const Route = createFileRoute("/maiores-de-18")({
  loader: async () => ({
    documento: await carregarDocumentoLegal({ data: { chave: "maioridade" } }),
  }),
  head: () => ({
    meta: [
      { title: "Conteúdo para maiores de 18 anos | DelaTrip" },
      {
        name: "description",
        content:
          "Aviso de conteúdo adulto do portal DelaTrip: informação de caráter cultural e educativo destinada a maiores de 18 anos.",
      },
      { property: "og:title", content: "Conteúdo para maiores de 18 anos | DelaTrip" },
      {
        property: "og:description",
        content: "Aviso legal de conteúdo adulto e informativo do portal DelaTrip.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: absoluteUrl("/maiores-de-18") },
    ],
    links: [canonical("/maiores-de-18")],
    scripts: [
      jsonLd(
        breadcrumbLd([
          { name: "Início", path: "/" },
          { name: "Maiores de 18", path: "/maiores-de-18" },
        ]),
      ),
    ],
  }),
  component: Maioridade,
});

function Maioridade() {
  const { documento } = Route.useLoaderData();

  return (
    <LegalLayout
      titulo="Conteúdo para maiores de 18 anos"
      descricao="Aviso legal sobre a natureza do conteúdo publicado no portal."
      documento={documento}
    >
      <h2>Aviso</h2>
      <p>{AVISO_SANITARIO}</p>

      <h2>Natureza do conteúdo</h2>
      <p>
        O portal tem caráter cultural, informativo e educativo. Não vendemos produtos
        pela internet, não incentivamos o consumo e não realizamos publicidade de
        produtos derivados do tabaco.
      </p>

      <h2>Saúde</h2>
      <p>
        Fumar é prejudicial à saúde e pode causar doenças graves. Em caso de dúvidas,
        procure orientação profissional. O Ministério da Saúde e a Anvisa mantêm
        informações oficiais sobre o tema.
      </p>

      <h2>Legislação de referência</h2>
      <ul>
        <li>Lei nº 9.294/1996</li>
        <li>RDC ANVISA nº 558/2021</li>
        <li>Lei nº 13.709/2018 (LGPD)</li>
      </ul>

      <p>
        Leia também os{" "}
        <Link to="/termos-de-uso" className="text-primary underline underline-offset-4">
          Termos de Uso
        </Link>
        .
      </p>
    </LegalLayout>
  );
}

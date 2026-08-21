import { createFileRoute, Link } from "@tanstack/react-router";

import { LegalLayout } from "@/components/LegalLayout";
import { Button } from "@/components/ui/button";
import { abrirPreferenciasCookies } from "@/lib/consentimento";
import { carregarDocumentoLegal } from "@/lib/portal.functions";
import { carregarSeoPublico } from "@/lib/site-config.functions";
import { absoluteUrl, canonical, jsonLd, breadcrumbLd } from "@/lib/seo";

export const Route = createFileRoute("/politica-de-cookies")({
  loader: async () => ({
    documento: await carregarDocumentoLegal({ data: { chave: "cookies" } }),
    seo: await carregarSeoPublico(),
  }),
  head: () => ({
    meta: [
      { title: "Política de Cookies | DelaTrip" },
      {
        name: "description",
        content:
          "Entenda quais cookies o portal DelaTrip utiliza, para que servem e como gerenciar suas preferências a qualquer momento.",
      },
      { property: "og:title", content: "Política de Cookies | DelaTrip" },
      {
        property: "og:description",
        content: "Categorias de cookies utilizadas pelo portal DelaTrip e como gerenciá-las.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: absoluteUrl("/politica-de-cookies") },
    ],
    links: [canonical("/politica-de-cookies")],
    scripts: [
      jsonLd(breadcrumbLd([
        { name: "Início", path: "/" },
        { name: "Política de Cookies", path: "/politica-de-cookies" },
      ])),
    ],
  }),
  component: Cookies,
});

function Cookies() {
  const { documento, seo } = Route.useLoaderData();

  const linhas: [string, string, string, string, string][] = [
    [
      "delatrip_consent_v2",
      "DelaTrip",
      "Essencial",
      "Guarda a sua escolha de cookies.",
      "12 meses",
    ],
    [
      "delatrip_anon_id",
      "DelaTrip",
      "Essencial",
      "Identificador técnico anônimo para registrar o consentimento e curtidas.",
      "12 meses",
    ],
    [
      "delatrip_maioridade",
      "DelaTrip",
      "Essencial",
      "Evita repetir o aviso de conteúdo adulto.",
      "6 meses",
    ],
  ];

  if (seo.ga4.ativo && seo.ga4.id) {
    linhas.push([
      "_ga / _ga_*",
      "Google Analytics",
      "Análise",
      "Medição de audiência e uso das páginas.",
      "Até 24 meses",
    ]);
  }
  if (seo.gtm.ativo && seo.gtm.id) {
    linhas.push([
      "Tags do GTM",
      "Google Tag Manager",
      "Análise",
      "Gerencia as tags autorizadas do portal.",
      "Varia por tag",
    ]);
  }
  if (seo.metaPixel.ativo && seo.metaPixel.id) {
    linhas.push([
      "_fbp",
      "Meta",
      "Marketing",
      "Mensuração publicitária, quando autorizada.",
      "Até 3 meses",
    ]);
  }

  return (
    <LegalLayout
      titulo="Política de Cookies"
      descricao="Como o portal utiliza cookies e tecnologias semelhantes."
      documento={documento}
    >
      <h2>O que são cookies</h2>
      <p>
        Cookies são pequenos arquivos gravados no seu navegador quando você acessa um
        site. Eles permitem que o portal funcione corretamente, lembre escolhas e,
        quando autorizado, entenda como as páginas são utilizadas.
      </p>

      <h2>Categorias utilizadas</h2>
      <h3>Cookies essenciais</h3>
      <p>Necessários para funcionamento e segurança do portal. Não podem ser desativados.</p>
      <h3>Cookies de preferências</h3>
      <p>Guardam escolhas feitas por você durante a navegação.</p>
      <h3>Cookies de análise</h3>
      <p>Medem audiência e uso das páginas, por exemplo com o Google Analytics.</p>
      <h3>Cookies de marketing</h3>
      <p>
        Tecnologias publicitárias, como o Meta Pixel, utilizadas apenas quando estiverem
        ativas e autorizadas por você.
      </p>

      <h2>Cookies e tecnologias em uso</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
              <th className="py-2 pr-4">Cookie</th>
              <th className="py-2 pr-4">Fornecedor</th>
              <th className="py-2 pr-4">Categoria</th>
              <th className="py-2 pr-4">Finalidade</th>
              <th className="py-2">Duração</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((linha) => (
              <tr key={linha[0]} className="border-b border-border/60 align-top">
                <td className="py-3 pr-4 font-medium">{linha[0]}</td>
                <td className="py-3 pr-4 text-muted-foreground">{linha[1]}</td>
                <td className="py-3 pr-4 text-muted-foreground">{linha[2]}</td>
                <td className="py-3 pr-4 text-muted-foreground">{linha[3]}</td>
                <td className="py-3 text-muted-foreground">{linha[4]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Gerenciar preferências</h2>
      <p>
        Você pode alterar sua escolha a qualquer momento pelo painel de preferências ou
        apagando os cookies no seu navegador.
      </p>
      <Button className="mt-4" onClick={() => abrirPreferenciasCookies()}>
        Preferências de Cookies
      </Button>
      <p>
        Veja também a{" "}
        <Link
          to="/politica-de-privacidade"
          className="text-primary underline underline-offset-4"
        >
          Política de Privacidade
        </Link>
        .
      </p>
    </LegalLayout>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";

import { PageHeader } from "@/components/PageHeader";
import { SectionHeading } from "@/components/SectionHeading";
import { Button } from "@/components/ui/button";
import { carregarConfigPortal } from "@/lib/portal.functions";
import { carregarPagina } from "@/lib/paginas.functions";
import { absoluteUrl, breadcrumbLd, canonical, jsonLd, metaDaRota } from "@/lib/seo";

export const Route = createFileRoute("/quem-somos")({
  loader: async () => ({
    config: await carregarConfigPortal(),
    pagina: await carregarPagina({ data: { caminho: "/quem-somos" } }),
  }),
  head: ({ loaderData }) => ({
    meta: metaDaRota(loaderData?.pagina?.seo, {
      titulo: "Quem somos | DelaTrip",
      descricao:
        "Conheça a DelaTrip: portal institucional e cultural sobre repertório, marcas e conteúdo editorial da cena head shop brasileira.",
      caminho: "/quem-somos",
    }),
    links: [canonical("/quem-somos")],
    scripts: [
      jsonLd({
        "@context": "https://schema.org",
        "@type": "AboutPage",
        name: "Quem somos — DelaTrip",
        url: absoluteUrl("/quem-somos"),
      }),
      jsonLd(
        breadcrumbLd([
          { name: "Início", path: "/" },
          { name: "Quem somos", path: "/quem-somos" },
        ]),
      ),
    ],
  }),
  component: QuemSomos,
});

const PILARES = [
  {
    titulo: "Curadoria",
    texto:
      "Selecionamos marcas e acessórios com critério, reunindo o que faz sentido para quem valoriza repertório e qualidade.",
  },
  {
    titulo: "Cultura",
    texto:
      "Publicamos conteúdo editorial, guias e conversas que ampliam o entendimento sobre a cena, sem incentivo ao consumo.",
  },
  {
    titulo: "Transparência",
    texto:
      "Informação clara sobre origem, características e legislação aplicável, com respeito às normas brasileiras.",
  },
];

function QuemSomos() {
  const { config, pagina } = Route.useLoaderData();
  const blocos = (pagina?.blocos ?? {}) as Record<string, string>;
  const { empresa } = config;

  return (
    <>
      <PageHeader
        eyebrow="Institucional"
        titulo={blocos["titulo"] || "Quem somos"}
        descricao={
          blocos["subtitulo"] ||
          "Um portal sobre cultura, curadoria e repertório — não uma loja."
        }
        crumbs={[{ label: "Quem somos" }]}
      />

      <div className="mx-auto max-w-5xl px-4 py-14">
        {blocos["corpo"] ? (
          <div
            className="prose-editor max-w-none"
            dangerouslySetInnerHTML={{ __html: blocos["corpo"] }}
          />
        ) : (
          <div className="max-w-3xl space-y-4 text-base leading-relaxed text-muted-foreground">
            <p>
              A DelaTrip nasceu da vontade de reunir, em um só lugar, marcas com
              identidade e conteúdo que explique o contexto por trás delas. Este portal é
              institucional e cultural: aqui você encontra catálogo informativo, guias e
              histórias — não uma loja virtual.
            </p>
            <p>
              Trabalhamos com curadoria de acessórios, ervas e flores, sempre respeitando
              a legislação brasileira, que proíbe a venda de produtos derivados do tabaco
              pela internet. O que publicamos sobre tabaco tem finalidade informativa.
            </p>
          </div>
        )}

        <section className="mt-14">
          <SectionHeading eyebrow="Nossos pilares" titulo="O que nos guia" />
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {PILARES.map((p) => (
              <article
                key={p.titulo}
                className="rounded-lg border border-border bg-card p-5"
              >
                <h3 className="text-lg font-semibold uppercase">{p.titulo}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {p.texto}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-14 rounded-lg border border-border bg-card p-6">
          <h2 className="text-xl font-semibold uppercase">Dados institucionais</h2>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Razão social</dt>
              <dd>{empresa.razaoSocial}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">CNPJ</dt>
              <dd>{empresa.cnpj}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Endereço</dt>
              <dd>{empresa.endereco}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Atendimento</dt>
              <dd>{empresa.horario}</dd>
            </div>
          </dl>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/contato">Falar com a DelaTrip</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/podcast">Ouvir o podcast</Link>
            </Button>
          </div>
        </section>
      </div>
    </>
  );
}

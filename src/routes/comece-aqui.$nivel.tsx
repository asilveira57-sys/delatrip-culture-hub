import { useMemo } from "react";
import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { ArtigoConteudo } from "@/components/ArtigoConteudo";
import { PageHeader } from "@/components/PageHeader";
import { ConjuntoGuia } from "@/components/guia/ConjuntoGuia";
import { Button } from "@/components/ui/button";
import { LINHAS, NIVEIS, type Nivel } from "@/config/guia-perfis";
import { PERFIS, ROTULO_LINHA_PUBLICA, listarKitsAtivos, montarConjunto } from "@/lib/guia-publico";
import { useOverlays } from "@/lib/overlay";
import { rich, texto } from "@/lib/paginas-core";
import { carregarPagina } from "@/lib/paginas.functions";
import { breadcrumbLd, canonical, jsonLd, metaDaRota } from "@/lib/seo";

export const Route = createFileRoute("/comece-aqui/$nivel")({
  loader: async ({ params }) => {
    if (!NIVEIS.includes(params.nivel as Nivel)) throw notFound();
    const pagina = await carregarPagina({ data: { caminho: `/comece-aqui/${params.nivel}` } });
    return { ...pagina, nivel: params.nivel as Nivel };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Perfil não encontrado" }, { name: "robots", content: "noindex" }] };
    const p = PERFIS[loaderData.nivel];
    const caminho = `/comece-aqui/${loaderData.nivel}`;
    return {
      meta: [
        ...metaDaRota(loaderData.seo, {
          titulo: `Perfil ${p.nome} — Guia para iniciantes | DeLaTrip`,
          descricao: `${p.frase} Veja os conjuntos de acessórios indicados para o perfil ${p.nome}.`,
          caminho,
        }),
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary" },
      ],
      links: [canonical(caminho)],
      scripts: [
        jsonLd(
          breadcrumbLd([
            { name: "Home", path: "/" },
            { name: "Comece aqui", path: "/comece-aqui" },
            { name: p.nome, path: caminho },
          ]),
        ),
      ],
    };
  },
  component: PerfilPage,
});

function PerfilPage() {
  const { blocos, nivel } = Route.useLoaderData();
  const perfil = PERFIS[nivel];
  const corpo = rich(blocos, "corpo");
  const overlays = useOverlays();
  const { data: kits } = useQuery({ queryKey: ["guia-kits-publicos"], queryFn: listarKitsAtivos });

  const porLinha = useMemo(
    () =>
      LINHAS.map((linha) => {
        const temKit = (kits ?? []).some((k) => k.nivel === nivel && k.linha === linha);
        return { linha, temKit, ...montarConjunto({ nivel, linha, kits: temKit ? (kits ?? []) : [], overlays }) };
      }),
    [kits, nivel, overlays],
  );

  return (
    <>
      <PageHeader
        eyebrow="Guia para iniciantes"
        titulo={texto(blocos, "titulo", `Perfil ${perfil.nome}`)}
        descricao={texto(blocos, "subtitulo", perfil.frase)}
        crumbs={[{ label: "Comece aqui", to: "/comece-aqui" }, { label: perfil.nome }]}
      />
      <div className="mx-auto max-w-6xl px-4 py-12">
        {corpo ? (
          <ArtigoConteudo html={corpo} className="max-w-3xl" />
        ) : (
          <p className="max-w-3xl text-muted-foreground">{perfil.texto}</p>
        )}

        {porLinha.map(({ linha, itens }) => (
          <section key={linha} className="mt-14">
            <h2 className="text-xl font-semibold uppercase">Linha {ROTULO_LINHA_PUBLICA[linha]}</h2>
            <div className="mt-4">
              <ConjuntoGuia itens={itens} nivel={nivel} linha={linha} />
            </div>
          </section>
        ))}

        <div className="mt-16 rounded-lg border border-border bg-card p-6 text-center">
          <p className="text-lg font-semibold">Não tem certeza do seu perfil?</p>
          <Button asChild className="mt-4">
            <Link to="/comece-aqui" hash="quiz">Fazer o quiz</Link>
          </Button>
        </div>
      </div>
    </>
  );
}

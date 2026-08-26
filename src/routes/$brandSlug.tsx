import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ImageOff, Search } from "lucide-react";

import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { ProductCard } from "@/components/ProductCard";
import { FilterButton, SortSelect } from "@/components/CatalogFilters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getBrandPageContent } from "@/config/brand-pages";
import { ArtigoConteudo } from "@/components/ArtigoConteudo";
import { caminhoMarca, conteudoMarca } from "@/lib/marcas-core";
import { carregarPagina } from "@/lib/paginas.functions";
import { FaqSecao } from "@/components/FaqSecao";
import { faqLd } from "@/lib/faq-core";
import { carregarFaq } from "@/lib/faq.functions";
import { getBrand, productsByBrand, sortProducts, type SortKey } from "@/lib/catalog";
import { absoluteUrl, breadcrumbLd, canonical, jsonLd } from "@/lib/seo";
import { mergeList, useOverlays } from "@/lib/overlay";

export const Route = createFileRoute("/$brandSlug")({
  // Conteúdo vem do admin: sempre recarrega para refletir o que acabou de ser salvo.
  staleTime: 0,
  gcTime: 0,
  shouldReload: true,
  loader: async ({ params }) => {
    const [pagina, faq] = await Promise.all([
      carregarPagina({ data: { caminho: caminhoMarca(params.brandSlug) } }),
      carregarFaq({ data: { tipo: "marca", alvo: params.brandSlug } }),
    ]);
    return { ...pagina, faq };
  },

  head: ({ params, loaderData }) => {
    const marca = getBrand(params.brandSlug);
    if (!marca) {
      return {
        meta: [
          { title: "Página não encontrada — DeLaTrip" },
          { name: "robots", content: "noindex, nofollow" },
        ],
      };
    }
    const conteudo = conteudoMarca(
      getBrandPageContent(marca.slug, marca.nome, marca.totalProdutos),
      loaderData?.blocos ?? null,
    );
    const seo = loaderData?.seo;
    const titulo = seo?.titulo?.trim() || conteudo.seoTitle || `${marca.nome} — Marca | DeLaTrip`;
    const descricao = seo?.descricao?.trim() || conteudo.seoDescription || conteudo.resumo;
    return {
      meta: [
        { title: titulo },
        { name: "description", content: descricao },
        ...(seo?.keywords?.trim() ? [{ name: "keywords", content: seo.keywords.trim() }] : []),
        { name: "robots", content: seo?.noindex ? "noindex, nofollow" : "index, follow" },
        { property: "og:type", content: "website" },
        { property: "og:locale", content: "pt_BR" },
        { property: "og:title", content: titulo },
        { property: "og:description", content: descricao },
        { property: "og:url", content: absoluteUrl(`/${marca.slug}`) },
        { name: "twitter:card", content: "summary_large_image" },
        ...(conteudo.capa
          ? [
              { property: "og:image", content: conteudo.capa },
              { name: "twitter:image", content: conteudo.capa },
            ]
          : []),
      ],
      links: [canonical(`/${marca.slug}`)],
      scripts: [
        jsonLd({
          "@context": "https://schema.org",
          "@type": "Brand",
          name: marca.nome,
          description: descricao,
          url: absoluteUrl(`/${marca.slug}`),
          ...(conteudo.capa ? { logo: conteudo.capa } : {}),
          ...(conteudo.site ? { sameAs: [conteudo.site] } : {}),
        }),
        jsonLd(
          breadcrumbLd([
            { name: "Início", path: "/" },
            { name: "Marcas", path: "/marcas" },
            { name: marca.nome, path: `/${marca.slug}` },
          ]),
        ),
        ...((loaderData?.faq ?? []).length > 0 ? [jsonLd(faqLd(loaderData!.faq))] : []),
      ],
    };
  },
  component: BrandPage,
});

const ORDENS: SortKey[] = ["relevancia", "nome-az", "nome-za", "novidades"];
const PAGINA = 24;

function BrandPage() {
  const { brandSlug } = Route.useParams();
  const marca = getBrand(brandSlug);

  if (!marca) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <EmptyState
          titulo="Página não encontrada"
          descricao="O endereço acessado não corresponde a nenhuma marca ou seção do site."
          acao={
            <Button asChild>
              <Link to="/marcas">Ver todas as marcas</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return <BrandContent key={marca.slug} slug={marca.slug} />;
}

function BrandContent({ slug }: { slug: string }) {
  const marca = getBrand(slug)!;
  const { blocos, faq } = Route.useLoaderData();
  const conteudo = conteudoMarca(
    getBrandPageContent(marca.slug, marca.nome, marca.totalProdutos),
    blocos,
  );
  const overlays = useOverlays();
  const produtos = useMemo(
    () => mergeList(productsByBrand(marca.slug), overlays),
    [marca.slug, overlays],
  );

  const categorias = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const p of produtos) {
      const nome = p.categoriaNome;
      if (nome) mapa.set(nome, (mapa.get(nome) ?? 0) + 1);
    }
    return [...mapa.entries()].sort((a, b) => b[1] - a[1]);
  }, [produtos]);

  const [termo, setTermo] = useState("");
  const [categoria, setCategoria] = useState("");
  const [ordem, setOrdem] = useState<SortKey>(ORDENS[0]!);
  const [visiveis, setVisiveis] = useState(PAGINA);
  const [erroCapa, setErroCapa] = useState(false);

  const lista = useMemo(() => {
    const q = termo.trim().toLowerCase();
    const base = produtos.filter(
      (p) =>
        (!categoria || p.categoriaNome === categoria) &&
        (!q || p.nome.toLowerCase().includes(q)),
    );
    return sortProducts(base, ordem);
  }, [produtos, termo, categoria, ordem]);

  const meta = [
    conteudo.pais ? { rotulo: "Origem", valor: conteudo.pais } : null,
    conteudo.fundacao ? { rotulo: "Fundação", valor: conteudo.fundacao } : null,
    { rotulo: "Produtos no catálogo", valor: String(produtos.length) },
  ].filter(Boolean) as { rotulo: string; valor: string }[];

  return (
    <>
      <PageHeader
        eyebrow={conteudo.eyebrow}
        titulo={conteudo.headline}
        descricao={conteudo.resumo}
        crumbs={[{ label: "Marcas", to: "/marcas" }, { label: marca.nome }]}
      />

      {conteudo.capa && !erroCapa ? (
        <section className="mx-auto max-w-6xl px-4 pt-8">
          <img
            src={conteudo.capa}
            alt={`Imagem de capa da marca ${marca.nome}`}
            width={1600}
            height={900}
            loading="eager"
            fetchPriority="high"
            onError={() => setErroCapa(true)}
            className="aspect-[16/9] w-full rounded-lg border border-border bg-card object-cover"
          />
        </section>
      ) : (
        <section className="mx-auto max-w-6xl px-4 pt-8">
          <div
            role="img"
            aria-label={`Banner de placeholder da marca ${marca.nome}`}
            className="flex aspect-[16/9] w-full flex-col items-center justify-center gap-3 rounded-lg border border-border bg-gradient-to-br from-primary/20 to-background px-6 text-center"
          >
            <ImageOff className="size-12 text-primary/60" aria-hidden="true" />
            <span className="font-display text-lg font-semibold uppercase tracking-wide text-primary">
              {marca.nome}
            </span>
            <span className="text-xs text-muted-foreground">
              Banner indisponível
            </span>
          </div>
        </section>
      )}


      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-10 lg:grid-cols-[1fr_300px]">
          <div className="space-y-4">
            <h2 className="font-display text-2xl font-semibold uppercase tracking-wide">
              Sobre a marca
            </h2>
            {conteudo.sobreHtml ? (
              <ArtigoConteudo html={conteudo.sobreHtml} />
            ) : (
              conteudo.sobre.map((p, i) => (
                <p key={i} className="text-sm leading-relaxed text-muted-foreground">
                  {p}
                </p>
              ))
            )}
          </div>

          <aside className="rounded-lg border border-border bg-card p-5">
            <h2 className="eyebrow text-primary">Ficha da marca</h2>
            <dl className="mt-4 space-y-3 text-sm">
              {meta.map((m) => (
                <div key={m.rotulo} className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">{m.rotulo}</dt>
                  <dd className="font-medium">{m.valor}</dd>
                </div>
              ))}
            </dl>
          </aside>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-3">
          {conteudo.destaques.map((d) => (
            <div key={d.titulo} className="rounded-lg border border-border bg-card p-5">
              <h3 className="font-semibold">{d.titulo}</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                {d.descricao}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-background">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="font-display text-2xl font-semibold uppercase tracking-wide">
            Produtos {marca.nome}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {lista.length} {lista.length === 1 ? "produto relacionado" : "produtos relacionados"} no
            catálogo.
          </p>

          {produtos.length > 0 && (
            <div className="mt-6 flex flex-col gap-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative sm:max-w-xs sm:flex-1">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <Input
                    value={termo}
                    onChange={(e) => {
                      setTermo(e.target.value.slice(0, 100));
                      setVisiveis(PAGINA);
                    }}
                    placeholder={`Buscar em ${marca.nome}`}
                    aria-label={`Buscar produtos ${marca.nome}`}
                    className="pl-9"
                  />
                </div>
                <SortSelect
                  valor={ordem}
                  onChange={(v) => {
                    setOrdem(v);
                    setVisiveis(PAGINA);
                  }}
                />
              </div>

              {categorias.length > 1 && (
                <ul className="flex flex-wrap gap-2">
                  <li className="w-auto">
                    <div className="w-auto">
                      <FilterButton ativo={!categoria} onClick={() => setCategoria("")}>
                        Todas
                      </FilterButton>
                    </div>
                  </li>
                  {categorias.map(([nome, total]) => (
                    <li key={nome}>
                      <FilterButton
                        ativo={categoria === nome}
                        onClick={() => {
                          setCategoria(nome === categoria ? "" : nome);
                          setVisiveis(PAGINA);
                        }}
                      >
                        {nome} ({total})
                      </FilterButton>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="mt-8">
            {lista.length === 0 ? (
              <EmptyState titulo="Nenhum produto nesta seleção" />
            ) : (
              <>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {lista.slice(0, visiveis).map((p) => (
                    <ProductCard key={p.slug} produto={p} />
                  ))}
                </div>
                {visiveis < lista.length && (
                  <div className="mt-8 flex justify-center">
                    <Button variant="outline" onClick={() => setVisiveis((v) => v + PAGINA)}>
                      Carregar mais ({lista.length - visiveis} restantes)
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>

          <FaqSecao itens={faq} className="mt-16 border-t border-border pt-10" />
        </div>
      </section>
    </>
  );
}

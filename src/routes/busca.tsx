import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

import { absoluteUrl, canonical } from "@/lib/seo";
import { useMemo } from "react";
import { Search } from "lucide-react";

import { ActiveChips, SortSelect } from "@/components/CatalogFilters";
import { BrandCard } from "@/components/BrandCard";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  brandName,
  brandsOf,
  filterProducts,
  searchBrands,
  searchProducts,
  type SortKey,
} from "@/lib/catalog";

type BuscaSearch = { q: string; marca: string; ordem: SortKey };

const ORDENS: SortKey[] = ["relevancia", "nome-az", "nome-za", "novidades"];

export const Route = createFileRoute("/busca")({
  validateSearch: (search: Record<string, unknown>): BuscaSearch => {
    const ordem = String(search["ordem"] ?? "relevancia") as SortKey;
    return {
      q: String(search["q"] ?? "").slice(0, 100),
      marca: String(search["marca"] ?? ""),
      ordem: ORDENS.includes(ordem) ? ordem : "relevancia",
    };
  },
  head: () => ({
    meta: [
      { title: "Busca no catálogo — DeLaTrip" },
      {
        name: "description",
        content:
          "Encontre sedas, dichavadores, bongs, bandejas e marcas no catálogo da DeLaTrip pesquisando por nome, marca ou referência.",
      },
      { name: "robots", content: "noindex, follow" },
      { property: "og:title", content: "Busca no catálogo — DeLaTrip" },
      {
        property: "og:description",
        content: "Pesquise produtos e marcas do catálogo DeLaTrip.",
      },
      { property: "og:url", content: absoluteUrl("/busca") },
    ],
    links: [canonical("/busca")],
  }),
  component: BuscaPage,
});

function BuscaPage() {
  const { q, marca, ordem } = Route.useSearch();
  const navigate = useNavigate({ from: "/busca" });

  const setSearch = (patch: Partial<BuscaSearch>) =>
    navigate({ search: (prev: BuscaSearch) => ({ ...prev, ...patch }) });

  const produtos = useMemo(
    () => (q ? filterProducts({ q, marca, ordem }) : []),
    [q, marca, ordem],
  );
  const marcas = useMemo(() => (q ? searchBrands(q) : []), [q]);
  const marcasDisponiveis = useMemo(
    () => (q ? brandsOf(searchProducts(q)) : []),
    [q],
  );

  const chips = [
    ...(marca
      ? [{ label: brandName(marca), onRemove: () => setSearch({ marca: "" }) }]
      : []),
  ];

  return (
    <>
      <PageHeader
        eyebrow="Busca"
        titulo={q ? `Resultados para “${q}”` : "Buscar no catálogo"}
        descricao="Pesquise por nome do produto, marca ou referência."
        crumbs={[{ label: "Busca" }]}
      />

      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="relative max-w-xl">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={q}
            onChange={(e) => setSearch({ q: e.target.value.slice(0, 100) })}
            placeholder="Buscar produto ou marca..."
            aria-label="Buscar no catálogo"
            className="pl-9"
          />
        </div>

        {!q ? (
          <div className="mt-10">
            <EmptyState
              titulo="Digite um termo para começar"
              descricao="Ou navegue pelo catálogo completo por categoria."
              acao={
                <Button asChild>
                  <Link to="/catalogo">Ver catálogo</Link>
                </Button>
              }
            />
          </div>
        ) : (
          <>
            {marcas.length > 0 && (
              <section className="mt-10">
                <h2 className="eyebrow text-primary">
                  Marcas ({marcas.length})
                </h2>
                <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {marcas.map((m) => (
                    <BrandCard key={m.slug} marca={m} />
                  ))}
                </div>
              </section>
            )}

            <section className="mt-12">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="eyebrow text-primary">
                  Produtos ({produtos.length})
                </h2>
                <SortSelect valor={ordem} onChange={(v) => setSearch({ ordem: v })} />
              </div>

              {marcasDisponiveis.length > 1 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setSearch({ marca: "" })}
                    aria-pressed={!marca}
                    className={`rounded-md border border-border px-3 py-1.5 text-sm ${
                      !marca
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    Todas as marcas
                  </button>
                  {marcasDisponiveis.map((b) => (
                    <button
                      key={b.slug}
                      type="button"
                      onClick={() => setSearch({ marca: b.slug })}
                      aria-pressed={marca === b.slug}
                      className={`rounded-md border border-border px-3 py-1.5 text-sm ${
                        marca === b.slug
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-accent"
                      }`}
                    >
                      {b.nome}
                    </button>
                  ))}
                </div>
              )}

              <div className="mt-4">
                <ActiveChips chips={chips} />
              </div>

              {produtos.length === 0 ? (
                <div className="mt-8">
                  <EmptyState
                    titulo={`Nenhum produto para “${q}”`}
                    descricao="Tente outro termo ou navegue pelas categorias."
                    acao={
                      <Button asChild variant="outline">
                        <Link to="/catalogo">Ver catálogo</Link>
                      </Button>
                    }
                  />
                </div>
              ) : (
                <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {produtos.map((p) => (
                    <ProductCard key={p.slug} produto={p} />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </>
  );
}

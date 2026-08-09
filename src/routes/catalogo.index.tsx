import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

import { absoluteUrl, canonical } from "@/lib/seo";
import { useMemo } from "react";
import { Search } from "lucide-react";

import { ActiveChips, FilterButton, SortSelect } from "@/components/CatalogFilters";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  brandName,
  brands,
  filterProducts,
  getCategoryByPath,
  rootCategories,
  type SortKey,
} from "@/lib/catalog";

type CatalogoSearch = {
  q?: string;
  categoria?: string;
  marca?: string;
  ordem?: SortKey;
};

const ORDENS: SortKey[] = ["relevancia", "nome-az", "nome-za", "novidades"];

export const Route = createFileRoute("/catalogo/")({
  validateSearch: (search: Record<string, unknown>): CatalogoSearch => {
    const ordem = String(search["ordem"] ?? "relevancia") as SortKey;
    return {
      q: String(search["q"] ?? "").slice(0, 100),
      categoria: String(search["categoria"] ?? ""),
      marca: String(search["marca"] ?? ""),
      ordem: ORDENS.includes(ordem) ? ordem : "relevancia",
    };
  },
  head: () => ({
    meta: [
      { title: "Catálogo de produtos — DeLaTrip" },
      {
        name: "description",
        content:
          "Explore o catálogo DeLaTrip: sedas, piteiras, dichavadores, bongs, bandejas, isqueiros e tabacos, com filtros por categoria, marca e ordenação.",
      },
      { property: "og:title", content: "Catálogo de produtos — DeLaTrip" },
      {
        property: "og:description",
        content:
          "Sedas, dichavadores, vidros, bandejas e acessórios com filtros por categoria e marca.",
      },
      { property: "og:url", content: absoluteUrl("/catalogo") },
    ],
    links: [canonical("/catalogo")],
  }),
  component: Catalogo,
});

function Catalogo() {
  const {
    q = "",
    categoria = "",
    marca = "",
    ordem = "relevancia",
  } = Route.useSearch();
  const navigate = useNavigate({ from: "/catalogo/" });

  const setSearch = (patch: Partial<CatalogoSearch>) =>
    navigate({ search: (prev) => ({ ...prev, ...patch }) });

  const lista = useMemo(
    () => filterProducts({ q, categoria, marca, ordem }),
    [q, categoria, marca, ordem],
  );

  const nomeCategoria = categoria ? getCategoryByPath(categoria)?.nome : undefined;

  const chips = [
    ...(q ? [{ label: `Busca: ${q}`, onRemove: () => setSearch({ q: "" }) }] : []),
    ...(nomeCategoria
      ? [{ label: nomeCategoria, onRemove: () => setSearch({ categoria: "" }) }]
      : []),
    ...(marca
      ? [{ label: brandName(marca), onRemove: () => setSearch({ marca: "" }) }]
      : []),
  ];

  return (
    <>
      <PageHeader
        eyebrow="Catálogo"
        titulo="Todos os produtos"
        descricao="Preços e disponibilidade são consultados na loja oficial e no marketplace."
        crumbs={[{ label: "Catálogo" }]}
      />

      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-10 lg:grid-cols-[220px_1fr]">
          <aside aria-label="Filtros">
            <h2 className="eyebrow text-primary">Categorias</h2>
            <ul className="mt-3 space-y-1">
              <li>
                <FilterButton ativo={!categoria} onClick={() => setSearch({ categoria: "" })}>
                  Todas
                </FilterButton>
              </li>
              {rootCategories.map((c) => (
                <li key={c.id}>
                  <FilterButton
                    ativo={categoria === c.slug}
                    onClick={() => setSearch({ categoria: c.slug })}
                  >
                    {c.nome}
                  </FilterButton>
                </li>
              ))}
            </ul>

            <h2 className="eyebrow mt-8 text-primary">Marcas</h2>
            <ul className="mt-3 space-y-1">
              <li>
                <FilterButton ativo={!marca} onClick={() => setSearch({ marca: "" })}>
                  Todas
                </FilterButton>
              </li>
              {brands.map((b) => (
                <li key={b.slug}>
                  <FilterButton
                    ativo={marca === b.slug}
                    onClick={() => setSearch({ marca: b.slug })}
                  >
                    {b.nome}
                  </FilterButton>
                </li>
              ))}
            </ul>
          </aside>

          <div>
            <div className="mb-5 flex flex-col gap-4">
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  value={q}
                  onChange={(e) => setSearch({ q: e.target.value.slice(0, 100) })}
                  placeholder="Filtrar por nome, marca ou referência"
                  aria-label="Filtrar produtos do catálogo"
                  className="pl-9"
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  {lista.length} {lista.length === 1 ? "produto" : "produtos"}
                </p>
                <SortSelect valor={ordem} onChange={(v) => setSearch({ ordem: v })} />
              </div>
              <ActiveChips chips={chips} />
            </div>

            {lista.length === 0 ? (
              <EmptyState
                titulo="Nenhum produto nesta seleção"
                descricao="Ajuste os filtros ou limpe a busca para ver mais itens."
                acao={
                  <Button
                    variant="outline"
                    onClick={() =>
                      setSearch({ q: "", categoria: "", marca: "", ordem: "relevancia" })
                    }
                  >
                    Limpar filtros
                  </Button>
                }
              />
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {lista.map((p) => (
                  <ProductCard key={p.slug} produto={p} />
                ))}
              </div>
            )}
          </div>
        </div>

        <p className="mt-12 text-sm text-muted-foreground">
          Procurando uma categoria específica?{" "}
          <Link to="/acessorios" className="text-primary underline underline-offset-4">
            Veja o hub de acessórios
          </Link>
          .
        </p>
      </div>
    </>
  );
}

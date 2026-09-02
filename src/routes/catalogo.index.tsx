import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

import { canonical, metaDaRota } from "@/lib/seo";
import { useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";

import {
  ActiveChips,
  FiltersPanel,
  SortSelect,
} from "@/components/CatalogFilters";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  brandName,
  filterProducts,
  getCategoryByPath,
  type SortKey,
} from "@/lib/catalog";
import { mergeList, useOverlays } from "@/lib/overlay";
import { texto } from "@/lib/paginas-core";
import { carregarPagina } from "@/lib/paginas.functions";


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
  loader: () => carregarPagina({ data: { caminho: "/catalogo" } }),
  head: ({ loaderData }) => ({
    meta: [
      ...metaDaRota(loaderData?.seo, {
        titulo: "Catálogo de produtos — DeLaTrip",
        descricao:
          "Explore o catálogo DeLaTrip: sedas, piteiras, dichavadores, bongs, bandejas, isqueiros e tabacos, com filtros por categoria, marca e ordenação.",
        ogDescricao:
          "Sedas, dichavadores, vidros, bandejas e acessórios com filtros por categoria e marca.",
        caminho: "/catalogo",
      }),
      { property: "og:type", content: "website" },
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
  const { blocos } = Route.useLoaderData();
  const navigate = useNavigate({ from: "/catalogo/" });

  const setSearch = (patch: Partial<CatalogoSearch>) =>
    navigate({ search: (prev: CatalogoSearch) => ({ ...prev, ...patch }) });

  const overlays = useOverlays();
  const lista = useMemo(
    () => mergeList(filterProducts({ q, categoria, marca, ordem }), overlays),
    [q, categoria, marca, ordem, overlays],
  );

  const PAGINA = 48;
  const [visiveis, setVisiveis] = useState(PAGINA);
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);

  useEffect(() => setVisiveis(PAGINA), [q, categoria, marca, ordem]);

  // O campo de busca atualiza a URL com atraso: digitar não refaz o filtro
  // dos ~1.500 produtos a cada tecla.
  const [termo, setTermo] = useState(q);
  useEffect(() => setTermo(q), [q]);
  useEffect(() => {
    if (termo === q) return;
    const id = setTimeout(
      () => navigate({ search: (prev: CatalogoSearch) => ({ ...prev, q: termo }) }),
      250,
    );
    return () => clearTimeout(id);
  }, [termo, q, navigate]);


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
        titulo={texto(blocos, "titulo", "Todos os produtos")}
        descricao={texto(
          blocos,
          "subtitulo",
          "Preços e disponibilidade são consultados na loja oficial e no marketplace.",
        )}
        crumbs={[{ label: "Catálogo" }]}
      />

      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-10 lg:grid-cols-[220px_1fr]">
          <aside aria-label="Filtros" className="hidden lg:block">
            <FiltersPanel categoria={categoria} onChange={setSearch} />
          </aside>

          <div>
            <div className="mb-5 flex flex-col gap-4">
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  value={termo}
                  onChange={(e) => setTermo(e.target.value.slice(0, 100))}

                  placeholder="Filtrar por nome, marca ou referência"
                  aria-label="Filtrar produtos do catálogo"
                  className="pl-9"
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  {lista.length} {lista.length === 1 ? "produto" : "produtos"}
                </p>
                <div className="flex items-center gap-2">
                  <Sheet open={filtrosAbertos} onOpenChange={setFiltrosAbertos}>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="sm" className="lg:hidden">
                        <SlidersHorizontal className="size-4" aria-hidden="true" />
                        Filtros
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-[85vw] max-w-sm overflow-y-auto">
                      <SheetHeader>
                        <SheetTitle>Filtros</SheetTitle>
                      </SheetHeader>
                      <div className="mt-4">
                        <FiltersPanel
                          categoria={categoria}
                          onChange={(patch) => {
                            setSearch(patch);
                            setFiltrosAbertos(false);
                          }}
                        />
                      </div>
                    </SheetContent>
                  </Sheet>
                  <SortSelect valor={ordem} onChange={(v) => setSearch({ ordem: v })} />
                </div>
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
              <>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {lista.slice(0, visiveis).map((p) => (
                    <ProductCard key={p.slug} produto={p} />
                  ))}
                </div>
                {visiveis < lista.length && (
                  <div className="mt-8 flex justify-center">
                    <Button
                      variant="outline"
                      onClick={() => setVisiveis((v) => v + PAGINA)}
                    >
                      Carregar mais ({lista.length - visiveis} restantes)
                    </Button>
                  </div>
                )}
              </>
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

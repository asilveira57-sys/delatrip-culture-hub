import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import {
  brands,
  getCategoryByPath,
  productsByCategory,
  products,
  rootCategories,
} from "@/lib/catalog";

export const Route = createFileRoute("/catalogo/")({
  head: () => ({
    meta: [
      { title: "Catálogo de produtos — DeLaTrip" },
      {
        name: "description",
        content:
          "Explore o catálogo DeLaTrip: sedas, piteiras, dichavadores, bongs, bandejas, isqueiros e tabacos, com filtros por categoria e marca.",
      },
      { property: "og:title", content: "Catálogo de produtos — DeLaTrip" },
      {
        property: "og:description",
        content: "Sedas, dichavadores, vidros, bandejas e acessórios com filtros por categoria e marca.",
      },
    ],
  }),
  component: Catalogo,
});

function Catalogo() {
  const [categoria, setCategoria] = useState<string | null>(null);
  const [marca, setMarca] = useState<string | null>(null);

  const lista = useMemo(
    () =>
      (categoria
        ? (() => {
            const cat = getCategoryByPath(categoria);
            return cat ? productsByCategory(cat) : [];
          })()
        : products
      ).filter((p) => !marca || p.marcaSlug === marca),
    [categoria, marca],
  );

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
                <FilterButton ativo={!categoria} onClick={() => setCategoria(null)}>
                  Todas
                </FilterButton>
              </li>
              {rootCategories.map((c) => (
                <li key={c.id}>
                  <FilterButton
                    ativo={categoria === c.slug}
                    onClick={() => setCategoria(c.slug)}
                  >
                    {c.nome}
                  </FilterButton>
                </li>
              ))}
            </ul>

            <h2 className="eyebrow mt-8 text-primary">Marcas</h2>
            <ul className="mt-3 space-y-1">
              <li>
                <FilterButton ativo={!marca} onClick={() => setMarca(null)}>
                  Todas
                </FilterButton>
              </li>
              {brands.map((b) => (
                <li key={b.slug}>
                  <FilterButton ativo={marca === b.slug} onClick={() => setMarca(b.slug)}>
                    {b.nome}
                  </FilterButton>
                </li>
              ))}
            </ul>
          </aside>

          <div>
            <p className="mb-5 text-sm text-muted-foreground">
              {lista.length} {lista.length === 1 ? "produto" : "produtos"}
            </p>
            {lista.length === 0 ? (
              <EmptyState
                acao={
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCategoria(null);
                      setMarca(null);
                    }}
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

function FilterButton({
  ativo,
  onClick,
  children,
}: {
  ativo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
        ativo
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      }`}
    >
      {children}
    </button>
  );
}

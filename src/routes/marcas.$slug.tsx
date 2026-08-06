import { createFileRoute, Link } from "@tanstack/react-router";

import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { getBrand, productsByBrand } from "@/lib/catalog";

export const Route = createFileRoute("/marcas/$slug")({
  head: ({ params }) => {
    const marca = getBrand(params.slug);
    const titulo = marca ? `${marca.nome} — Marcas | DeLaTrip` : "Marca não encontrada — DeLaTrip";
    const descricao = marca?.descricao ?? "Marca indisponível no catálogo DeLaTrip.";
    return {
      meta: [
        { title: titulo },
        { name: "description", content: descricao },
        { property: "og:title", content: titulo },
        { property: "og:description", content: descricao },
      ],
    };
  },
  component: MarcaPage,
});

function MarcaPage() {
  const { slug } = Route.useParams();
  const marca = getBrand(slug);

  if (!marca) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16">
        <EmptyState
          titulo="Marca não encontrada"
          acao={
            <Button asChild>
              <Link to="/marcas">Ver todas as marcas</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const lista = productsByBrand(marca.slug);

  return (
    <>
      <PageHeader
        eyebrow={marca.pais}
        titulo={marca.nome}
        descricao={marca.descricao}
        crumbs={[{ label: "Marcas", to: "/marcas" }, { label: marca.nome }]}
      />
      <div className="mx-auto max-w-6xl px-4 py-12">
        {lista.length === 0 ? (
          <EmptyState titulo="Sem produtos cadastrados desta marca" />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {lista.map((p) => (
              <ProductCard key={p.slug} produto={p} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

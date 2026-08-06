import { createFileRoute, Link } from "@tanstack/react-router";

import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { getCategory, productsByCategory } from "@/lib/catalog";

export const Route = createFileRoute("/catalogo/$")({
  head: ({ params }) => {
    const [cat, sub] = (params._splat ?? "").split("/");
    const categoria = getCategory(cat ?? "");
    const subNome = categoria?.subcategorias.find((s) => s.slug === sub)?.nome;
    const titulo = categoria
      ? `${categoria.nome}${subNome ? ` — ${subNome}` : ""} | DeLaTrip`
      : "Categoria não encontrada — DeLaTrip";
    const descricao =
      categoria?.descricao ?? "Categoria indisponível no catálogo DeLaTrip.";
    return {
      meta: [
        { title: titulo },
        { name: "description", content: descricao },
        { property: "og:title", content: titulo },
        { property: "og:description", content: descricao },
      ],
    };
  },
  component: CategoriaPage,
});

function CategoriaPage() {
  const { _splat } = Route.useParams();
  const [catSlug, subSlug] = (_splat ?? "").split("/");
  const categoria = getCategory(catSlug ?? "");

  if (!categoria) {
    return (
      <>
        <PageHeader titulo="Categoria não encontrada" crumbs={[{ label: "Catálogo", to: "/catalogo" }]} />
        <div className="mx-auto max-w-6xl px-4 py-16">
          <EmptyState
            titulo="Categoria inexistente"
            descricao="A categoria que você procurou não faz parte do nosso catálogo."
            acao={
              <Button asChild>
                <Link to="/catalogo">Ver catálogo</Link>
              </Button>
            }
          />
        </div>
      </>
    );
  }

  const sub = categoria.subcategorias.find((s) => s.slug === subSlug);
  const lista = productsByCategory(categoria.slug, sub?.slug);

  return (
    <>
      <PageHeader
        eyebrow="Categoria"
        titulo={sub ? `${categoria.nome} — ${sub.nome}` : categoria.nome}
        descricao={categoria.descricao}
        crumbs={[
          { label: "Catálogo", to: "/catalogo" },
          ...(sub
            ? [{ label: categoria.nome, to: `/catalogo/${categoria.slug}` }, { label: sub.nome }]
            : [{ label: categoria.nome }]),
        ]}
      />

      <div className="mx-auto max-w-6xl px-4 py-12">
        {categoria.subcategorias.length > 0 && (
          <div className="mb-8 flex flex-wrap gap-2">
            <Link
              to="/catalogo/$"
              params={{ _splat: categoria.slug }}
              className={`rounded-md border border-border px-3 py-1.5 text-sm ${
                sub ? "text-muted-foreground hover:bg-accent" : "bg-primary text-primary-foreground"
              }`}
            >
              Todos
            </Link>
            {categoria.subcategorias.map((s) => (
              <Link
                key={s.slug}
                to="/catalogo/$"
                params={{ _splat: `${categoria.slug}/${s.slug}` }}
                className={`rounded-md border border-border px-3 py-1.5 text-sm ${
                  sub?.slug === s.slug
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent"
                }`}
              >
                {s.nome}
              </Link>
            ))}
          </div>
        )}

        {lista.length === 0 ? (
          <EmptyState
            titulo="Sem produtos nesta seleção"
            descricao="Ainda não cadastramos itens aqui. Confira o catálogo completo."
            acao={
              <Button asChild>
                <Link to="/catalogo">Ver catálogo</Link>
              </Button>
            }
          />
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

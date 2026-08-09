import { createFileRoute, Link } from "@tanstack/react-router";

import { absoluteUrl, breadcrumbLd, canonical, jsonLd } from "@/lib/seo";

import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import {
  ancestorsOf,
  categoryMeta,
  categoryPath,
  childrenOf,
  getCategoryByPath,
  productsByCategory,
} from "@/lib/catalog";

export const Route = createFileRoute("/catalogo/$")({
  head: ({ params }) => {
    const categoria = getCategoryByPath(params._splat ?? "");
    const titulo = categoria
      ? `${categoria.nome} — Catálogo | DeLaTrip`
      : "Categoria não encontrada — DeLaTrip";
    const descricao = categoria
      ? categoryMeta(categoria).descricao
      : "Categoria indisponível no catálogo DeLaTrip.";
    return {
      meta: [
        { title: titulo },
        { name: "description", content: descricao },
        { property: "og:title", content: titulo },
        { property: "og:description", content: descricao },
        { property: "og:url", content: absoluteUrl(`/catalogo/${params._splat ?? ""}`) },
      ],
      links: [canonical(`/catalogo/${params._splat ?? ""}`)],
      scripts: categoria
        ? [
            jsonLd(
              breadcrumbLd([
                { name: "Início", path: "/" },
                { name: "Catálogo", path: "/catalogo" },
                ...ancestorsOf(categoria).map((c) => ({
                  name: c.nome,
                  path: `/catalogo/${categoryPath(c)}`,
                })),
              ]),
            ),
          ]
        : [],
    };
  },
  component: CategoriaPage,
});

function CategoriaPage() {
  const { _splat } = Route.useParams();
  const categoria = getCategoryByPath(_splat ?? "");

  if (!categoria) {
    return (
      <>
        <PageHeader
          titulo="Categoria não encontrada"
          crumbs={[{ label: "Catálogo", to: "/catalogo" }]}
        />
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

  const subcategorias = childrenOf(categoria.id);
  const lista = productsByCategory(categoria);
  const path = categoryPath(categoria);
  const trilha = path.split("/");
  const pai =
    trilha.length > 1 ? getCategoryByPath(trilha.slice(0, -1).join("/")) : undefined;

  return (
    <>
      <PageHeader
        eyebrow="Categoria"
        titulo={categoria.nome}
        descricao={categoryMeta(categoria).descricao}
        crumbs={[
          { label: "Catálogo", to: "/catalogo" },
          ...(pai
            ? [{ label: pai.nome, to: `/catalogo/${categoryPath(pai)}` }]
            : []),
          { label: categoria.nome },
        ]}
      />

      <div className="mx-auto max-w-6xl px-4 py-12">
        {subcategorias.length > 0 && (
          <div className="mb-8 flex flex-wrap gap-2">
            <span className="rounded-md border border-border bg-primary px-3 py-1.5 text-sm text-primary-foreground">
              Todos
            </span>
            {subcategorias.map((s) => (
              <Link
                key={s.id}
                to="/catalogo/$"
                params={{ _splat: `${path}/${s.slug}` }}
                className="rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent"
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

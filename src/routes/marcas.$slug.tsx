import { createFileRoute, Link } from "@tanstack/react-router";

import { absoluteUrl, breadcrumbLd, canonical, jsonLd } from "@/lib/seo";

import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { getBrand, productsByBrand } from "@/lib/catalog";

export const Route = createFileRoute("/marcas/$slug")({
  head: ({ params }) => {
    const marca = getBrand(params.slug);
    const titulo = marca ? `${marca.nome} — Marcas | DeLaTrip` : "Marca não encontrada — DeLaTrip";
    const descricao =
      marca?.descricao ??
      (marca
        ? `Conheça os produtos ${marca.nome} no catálogo DeLaTrip.`
        : "Marca indisponível no catálogo DeLaTrip.");
    return {
      meta: [
        { title: titulo },
        { name: "description", content: descricao },
        { property: "og:title", content: titulo },
        { property: "og:description", content: descricao },
        { property: "og:url", content: absoluteUrl(`/marcas/${params.slug}`) },
      ],
      links: [canonical(`/marcas/${params.slug}`)],
      scripts: marca
        ? [
            jsonLd({
              "@context": "https://schema.org",
              "@type": "Brand",
              name: marca.nome,
              ...(marca.descricao ? { description: marca.descricao } : {}),
              url: absoluteUrl(`/marcas/${marca.slug}`),
            }),
            jsonLd(
              breadcrumbLd([
                { name: "Início", path: "/" },
                { name: "Marcas", path: "/marcas" },
                { name: marca.nome, path: `/marcas/${marca.slug}` },
              ]),
            ),
          ]
        : [],
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
        eyebrow={marca.pais ?? (marca.marcaPropria ? "Marca própria" : "Marca")}
        titulo={marca.nome}
        descricao={
          marca.descricao ??
          `Produtos ${marca.nome} disponíveis no catálogo DeLaTrip.`
        }
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

import { createFileRoute, Link } from "@tanstack/react-router";
import { ExternalLink, ShoppingBag } from "lucide-react";

import { EmptyState } from "@/components/EmptyState";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ProductCard } from "@/components/ProductCard";
import { SectionHeading } from "@/components/SectionHeading";
import { Button } from "@/components/ui/button";
import { SHOW_PRICES } from "@/config/site";
import {
  brandName,
  categoryName,
  formatPrice,
  getProduct,
  imageFor,
  productsByCategory,
} from "@/lib/catalog";

export const Route = createFileRoute("/produto/$slug")({
  head: ({ params }) => {
    const produto = getProduct(params.slug);
    const titulo = produto
      ? `${produto.nome} — ${brandName(produto.marca)} | DeLaTrip`
      : "Produto não encontrado — DeLaTrip";
    const descricao =
      produto?.descricao ?? "Este produto não está disponível no catálogo DeLaTrip.";
    return {
      meta: [
        { title: titulo },
        { name: "description", content: descricao },
        { property: "og:title", content: titulo },
        { property: "og:description", content: descricao },
      ],
    };
  },
  component: ProdutoPage,
});

function ProdutoPage() {
  const { slug } = Route.useParams();
  const produto = getProduct(slug);

  if (!produto) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16">
        <EmptyState
          titulo="Produto não encontrado"
          descricao="O item que você procurou não está no catálogo."
          acao={
            <Button asChild>
              <Link to="/catalogo">Ver catálogo</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const relacionados = productsByCategory(produto.categoria)
    .filter((p) => p.slug !== produto.slug)
    .slice(0, 4);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Breadcrumb
        items={[
          { label: "Catálogo", to: "/catalogo" },
          { label: categoryName(produto.categoria), to: `/catalogo/${produto.categoria}` },
          { label: produto.nome },
        ]}
      />

      <div className="grid gap-10 lg:grid-cols-2">
        <img
          src={imageFor(produto.imagem)}
          alt={produto.nome}
          width={1024}
          height={1024}
          className="w-full rounded-lg border border-border bg-ink object-cover"
        />

        <div>
          <p className="eyebrow text-primary">{brandName(produto.marca)}</p>
          <h1 className="mt-2 text-3xl font-bold uppercase sm:text-4xl">
            {produto.nome}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {categoryName(produto.categoria)}
          </p>

          {SHOW_PRICES ? (
            <p className="mt-6 text-3xl font-semibold text-primary">
              {formatPrice(produto.preco)}
            </p>
          ) : (
            <p className="mt-6 rounded-lg border border-border bg-secondary/60 p-4 text-sm text-muted-foreground">
              Consulte o preço atualizado direto na loja oficial ou no Mercado Livre.
            </p>
          )}

          <p className="mt-6 text-sm leading-relaxed">{produto.descricao}</p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <a href={produto.linkOficial} target="_blank" rel="noopener noreferrer">
                <ExternalLink aria-hidden="true" />
                Ver no site oficial
              </a>
            </Button>
            <Button asChild size="lg" variant="marketplace">
              <a href={produto.linkMercadoLivre} target="_blank" rel="noopener noreferrer">
                <ShoppingBag aria-hidden="true" />
                Comprar no Mercado Livre
              </a>
            </Button>
          </div>

          <dl className="mt-10 divide-y divide-border border-y border-border text-sm">
            {Object.entries(produto.specs).map(([chave, valor]) => (
              <div key={chave} className="flex justify-between gap-4 py-3">
                <dt className="text-muted-foreground">{chave}</dt>
                <dd className="font-medium">{valor}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {relacionados.length > 0 && (
        <section className="mt-20">
          <SectionHeading eyebrow="Também em" titulo="Produtos relacionados" />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {relacionados.map((p) => (
              <ProductCard key={p.slug} produto={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

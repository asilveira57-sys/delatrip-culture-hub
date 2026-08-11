import { createFileRoute, Link } from "@tanstack/react-router";

import { absoluteUrl, breadcrumbLd, canonical, jsonLd } from "@/lib/seo";
import { ExternalLink, ShoppingBag } from "lucide-react";

import { EmptyState } from "@/components/EmptyState";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ProductCard } from "@/components/ProductCard";
import { ProductGallery } from "@/components/ProductGallery";

import { SectionHeading } from "@/components/SectionHeading";
import { Button } from "@/components/ui/button";
import { SHOW_PRICES, SITE } from "@/config/site";
import {
  categoryPath,
  formatPrice,
  getCategoryById,
  getProduct,
  getProductDetail,
  imageFor,
  plainText,
  productSpecs,
  productsByCategory,
} from "@/lib/catalog";

export const Route = createFileRoute("/produto/$slug")({
  loader: ({ params }) => getProductDetail(params.slug),
  head: ({ params, loaderData }) => {
    const produto = getProduct(params.slug);
    const detalhe = loaderData ?? null;
    const titulo = produto
      ? `${detalhe?.seoTitulo ?? produto.nome}${produto.marca ? ` — ${produto.marca}` : ""} | DeLaTrip`
      : "Produto não encontrado — DeLaTrip";
    const descricao = produto
      ? (detalhe?.seoDescricao ?? plainText(detalhe?.descricaoHtml ?? "", 155))
      : "Este produto não está disponível no catálogo DeLaTrip.";
    const foto =
      detalhe?.imagens.find((u: string) => u.startsWith("https://")) ??
      produto?.imagem ??
      undefined;
    const categoria = produto ? getCategoryById(produto.categoriaId) : undefined;

    return {
      meta: [
        { title: titulo },
        { name: "description", content: descricao },
        { property: "og:title", content: titulo },
        { property: "og:description", content: descricao },
        { property: "og:type", content: "product" },
        { property: "og:url", content: absoluteUrl(`/produto/${params.slug}`) },
        ...(foto
          ? [
              { property: "og:image", content: foto },
              { name: "twitter:image", content: foto },
            ]
          : []),
      ],
      links: [canonical(`/produto/${params.slug}`)],
      scripts: produto
        ? [
            jsonLd({
              "@context": "https://schema.org",
              "@type": "Product",
              name: produto.nome,
              description: plainText(detalhe?.descricaoHtml ?? "", 300),
              sku: produto.referencia ?? produto.id,
              ...(detalhe?.ean ? { gtin13: detalhe.ean } : {}),
              ...(foto ? { image: [foto] } : {}),
              ...(produto.marca
                ? { brand: { "@type": "Brand", name: produto.marca } }
                : {}),
              ...(categoria ? { category: categoria.nome } : {}),
              url: absoluteUrl(`/produto/${produto.slug}`),
            }),
            jsonLd(
              breadcrumbLd([
                { name: "Início", path: "/" },
                { name: "Catálogo", path: "/catalogo" },
                ...(categoria
                  ? [
                      {
                        name: categoria.nome,
                        path: `/catalogo/${categoryPath(categoria)}`,
                      },
                    ]
                  : []),
                { name: produto.nome, path: `/produto/${produto.slug}` },
              ]),
            ),
          ]
        : [],
    };
  },
  component: ProdutoPage,
});

function ProdutoPage() {
  const { slug } = Route.useParams();
  const detalhe = Route.useLoaderData();
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

  const categoria = getCategoryById(produto.categoriaId);
  const relacionados = (categoria ? productsByCategory(categoria) : [])
    .filter((p) => p.slug !== produto.slug)
    .slice(0, 4);
  const preco = produto.precoPromocional ?? produto.preco;
  const specs = productSpecs(produto, detalhe);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Breadcrumb
        items={[
          { label: "Catálogo", to: "/catalogo" },
          ...(categoria
            ? [{ label: categoria.nome, to: `/catalogo/${categoryPath(categoria)}` }]
            : []),
          { label: produto.nome },
        ]}
      />

      <div className="grid gap-10 lg:grid-cols-2">
        <ProductGallery
          nome={produto.nome}
          principal={imageFor(produto)}
          imagens={detalhe?.imagens ?? []}
        />


        <div>
          <p className="eyebrow text-primary">{produto.marca ?? "DeLaTrip"}</p>
          <h1 className="mt-2 text-3xl font-bold uppercase sm:text-4xl">
            {produto.nome}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {categoria?.nome ?? produto.categoriaNome}
          </p>

          {SHOW_PRICES && preco !== null ? (
            <p className="mt-6 flex items-baseline gap-3">
              <span className="text-3xl font-semibold text-primary">
                {formatPrice(preco)}
              </span>
              {produto.precoPromocional && produto.preco ? (
                <span className="text-base text-muted-foreground line-through">
                  {formatPrice(produto.preco)}
                </span>
              ) : null}
            </p>
          ) : (
            <p className="mt-6 rounded-lg border border-border bg-secondary/60 p-4 text-sm text-muted-foreground">
              Consulte o preço atualizado direto na loja oficial ou no Mercado Livre.
            </p>
          )}

          <div
            className="prose-delatrip mt-6 text-sm leading-relaxed [&_li]:mt-1 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5"
            // Conteúdo vem do export da própria loja (HTML já higienizado no conversor).
            dangerouslySetInnerHTML={{ __html: detalhe?.descricaoHtml ?? "" }}
          />

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <a
                href={produto.urlLoja ?? SITE.lojaOficial}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink aria-hidden="true" />
                Ver no site oficial
              </a>
            </Button>
            {produto.urlMercadoLivre ? (
              <Button asChild size="lg" variant="marketplace">
                <a
                  href={produto.urlMercadoLivre}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ShoppingBag aria-hidden="true" />
                  Comprar no Mercado Livre
                </a>
              </Button>
            ) : null}
          </div>

          {specs.length > 0 && (
            <dl className="mt-10 divide-y divide-border border-y border-border text-sm">
              {specs.map(([chave, valor]) => (
                <div key={chave} className="flex justify-between gap-4 py-3">
                  <dt className="text-muted-foreground">{chave}</dt>
                  <dd className="font-medium">{valor}</dd>
                </div>
              ))}
            </dl>
          )}
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

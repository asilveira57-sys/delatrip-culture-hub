import { createFileRoute, Link } from "@tanstack/react-router";

import { absoluteUrl, breadcrumbLd, canonical, jsonLd } from "@/lib/seo";
import { ExternalLink, ShoppingBag } from "lucide-react";

import { EmptyState } from "@/components/EmptyState";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ProductCard } from "@/components/ProductCard";
import { ProductGallery } from "@/components/ProductGallery";
import { Curtir } from "@/components/Curtir";
import { useQuery } from "@tanstack/react-query";

import { mergeList, overlayDescricao, useOverlays } from "@/lib/overlay";
import { fetchPostsPorSlug, useRelacionados } from "@/lib/relacionados";
import { PostCard } from "@/components/PostCard";

import { SectionHeading } from "@/components/SectionHeading";
import { FaqSecao } from "@/components/FaqSecao";
import { faqLd } from "@/lib/faq-core";
import { carregarFaq } from "@/lib/faq.functions";
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
  loader: async ({ params }) => {
    const [detalhe, faq] = await Promise.all([
      getProductDetail(params.slug),
      carregarFaq({ data: { tipo: "produto", alvo: params.slug } }),
    ]);
    return { detalhe, faq };
  },
  headers: ({ params }) => {
    const produto = getProduct(params.slug);
    return {
      "X-Robots-Tag": produto ? "index, follow" : "noindex, nofollow",
    };
  },
  head: ({ params, loaderData }) => {
    const produto = getProduct(params.slug);
    const detalhe = loaderData?.detalhe ?? null;
    const faq = loaderData?.faq ?? [];
    const titulo = produto
      ? `${detalhe?.seoTitulo ?? produto.nome}${produto.marca ? ` — ${produto.marca}` : ""} | DeLaTrip`
      : "Produto não encontrado — DeLaTrip";
    const categoria = produto ? getCategoryById(produto.categoriaId) : undefined;
    const resumo = detalhe?.seoDescricao?.trim()
      ? detalhe.seoDescricao.trim()
      : plainText(detalhe?.descricaoHtml ?? "", 155);
    const descricao = produto
      ? resumo ||
        `${produto.nome}${produto.marca ? ` da marca ${produto.marca}` : ""}${
          categoria ? ` na categoria ${categoria.nome}` : ""
        }. Confira no catálogo da DeLaTrip.`
      : "Este produto não está disponível no catálogo DeLaTrip.";
    const foto =
      detalhe?.imagens.find((u: string) => u.startsWith("https://")) ??
      produto?.imagem ??
      undefined;

    return {
      meta: [
        { title: titulo },
        { name: "description", content: descricao },
        { name: "robots", content: produto ? "index, follow" : "noindex, nofollow" },
        { property: "og:site_name", content: SITE.nome },
        { property: "og:locale", content: "pt_BR" },
        { property: "og:title", content: titulo },
        { property: "og:description", content: descricao },
        { property: "og:type", content: "product" },
        { property: "og:url", content: absoluteUrl(`/produto/${params.slug}`) },
        {
          name: "twitter:card",
          content: foto ? "summary_large_image" : "summary",
        },
        { name: "twitter:title", content: titulo },
        { name: "twitter:description", content: descricao },
        ...(foto
          ? [
              { property: "og:image", content: foto },
              { property: "og:image:alt", content: produto?.nome ?? "DeLaTrip" },
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
              offers: {
                "@type": "Offer",
                url: produto.urlLoja ?? absoluteUrl(`/produto/${produto.slug}`),
                priceCurrency: "BRL",
                availability: produto.disponivel
                  ? "https://schema.org/InStock"
                  : "https://schema.org/OutOfStock",
                ...(SHOW_PRICES && (produto.precoPromocional ?? produto.preco)
                  ? {
                      price: String(produto.precoPromocional ?? produto.preco),
                    }
                  : {}),
                seller: { "@type": "Organization", name: SITE.nome },

              },
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
            ...(faq.length > 0 ? [jsonLd(faqLd(faq))] : []),
          ]
        : [],
    };
  },
  component: ProdutoPage,
});

function ProdutoPage() {
  const { slug } = Route.useParams();
  const { detalhe, faq } = Route.useLoaderData();
  const overlays = useOverlays();
  const ov = overlays.get(slug);
  const relacionadosManuais = useRelacionados(slug);
  const { data: postsRelacionados } = useQuery({
    queryKey: ["produto-posts", slug, relacionadosManuais.posts.join(",")],
    queryFn: () => fetchPostsPorSlug(relacionadosManuais.posts),
    enabled: relacionadosManuais.posts.length > 0,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
  const produto = ov?.oculto ? undefined : getProduct(slug);

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
  const manuais = mergeList(
    relacionadosManuais.produtos
      .map((s: string) => getProduct(s))
      .filter((p): p is NonNullable<ReturnType<typeof getProduct>> => Boolean(p)),
    overlays,
  );
  const relacionados = (
    manuais.length > 0
      ? manuais
      : mergeList(categoria ? productsByCategory(categoria) : [], overlays)
  )
    .filter((p) => p.slug !== produto.slug)
    .slice(0, 8);
  const descricaoHtml = overlayDescricao(ov) ?? detalhe?.descricaoHtml ?? "";
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
            className="prose-delatrip mt-6 text-sm leading-relaxed [&_img]:mx-auto [&_img]:my-4 [&_img]:h-auto [&_img]:max-h-72 [&_img]:w-auto [&_img]:max-w-full [&_img]:rounded-md [&_li]:mt-1 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5"
            // Conteúdo vem do export da própria loja (HTML já higienizado no conversor).
            dangerouslySetInnerHTML={{ __html: descricaoHtml }}
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

          <div className="mt-6">
            <Curtir tipo="produto" alvo={produto.slug} />
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

      {(postsRelacionados ?? []).length > 0 && (
        <section className="mt-16">
          <SectionHeading eyebrow="Conteúdo" titulo="Leia também" />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {(postsRelacionados ?? []).map((post) => (
              <PostCard
                key={post.slug}
                post={{
                  slug: post.slug,
                  titulo: post.titulo,
                  resumo: post.resumo ?? "",
                  categoria: post.categoria ?? "Cultura",
                  data: (post.publicado_em ?? "").slice(0, 10),
                  capaUrl: post.capa_url,
                  capaAlt: post.capa_alt,
                }}
              />
            ))}
          </div>
        </section>
      )}

      <FaqSecao itens={faq} className="mt-16 border-t border-border pt-10" />
    </div>
  );
}

import { useEffect } from "react";

import { ProductCard } from "@/components/ProductCard";
import { getProduct } from "@/lib/catalog";
import { registrarEvento } from "@/lib/analytics-relacionados";

type Props = {
  slugPost: string;
  produtos: { slug: string; score: number }[];
  titulo?: string;
  className?: string;
};

/**
 * Bloco de produtos relacionados. Sem produtos relevantes, nada é exibido —
 * é melhor não mostrar do que mostrar produto aleatório.
 */
export function ProdutosRelacionados({
  slugPost,
  produtos,
  titulo = "Produtos relacionados",
  className,
}: Props) {
  const itens = produtos
    .map((r) => ({ relacao: r, produto: getProduct(r.slug) }))
    .filter((i): i is { relacao: { slug: string; score: number }; produto: NonNullable<ReturnType<typeof getProduct>> } =>
      Boolean(i.produto),
    );

  useEffect(() => {
    itens.forEach((item, posicao) =>
      registrarEvento("related_product_view", {
        post_id: slugPost,
        product_id: item.produto.slug,
        position: posicao,
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slugPost, produtos]);

  if (itens.length === 0) return null;

  return (
    <section className={className} aria-labelledby="produtos-relacionados">
      <h2 id="produtos-relacionados" className="text-lg font-semibold uppercase">
        {titulo}
      </h2>
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {itens.map((item, posicao) => (
          <div
            key={item.produto.slug}
            onClickCapture={() =>
              registrarEvento("related_product_click", {
                post_id: slugPost,
                product_id: item.produto.slug,
                position: posicao,
              })
            }
          >
            <ProductCard produto={item.produto} />
          </div>
        ))}
      </div>
    </section>
  );
}

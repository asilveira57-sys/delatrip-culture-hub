import { Link } from "@tanstack/react-router";
import { ExternalLink, ShoppingBag } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SHOW_PRICES, SITE } from "@/config/site";
import {
  categoryName,
  formatPrice,
  imageFor,
  type Product,
} from "@/lib/catalog";

export function ProductCard({ produto }: { produto: Product }) {
  const preco = produto.precoPromocional ?? produto.preco;

  return (
    <article className="card-lift group flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card">
      <Link
        to="/produto/$slug"
        params={{ slug: produto.slug }}
        className="block overflow-hidden bg-ink"
      >
        <img
          src={imageFor(produto)}
          alt={`${produto.nome}${produto.marca ? ` — ${produto.marca}` : ""}`}
          loading="lazy"
          width={1024}
          height={1024}
          className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <p className="eyebrow text-muted-foreground">{produto.marca ?? "\u00a0"}</p>
        <h3 className="mt-1 text-base font-semibold leading-snug">
          <Link
            to="/produto/$slug"
            params={{ slug: produto.slug }}
            className="hover:text-primary"
          >
            {produto.nome}
          </Link>
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          {produto.categoriaNome ?? categoryName(produto.categoriaId)}
        </p>

        {SHOW_PRICES && preco !== null ? (
          <p className="mt-3 flex items-baseline gap-2">
            <span className="text-lg font-semibold text-primary">
              {formatPrice(preco)}
            </span>
            {produto.precoPromocional && produto.preco ? (
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(produto.preco)}
              </span>
            ) : null}
          </p>
        ) : null}

        <div className="mt-4 flex flex-1 flex-col justify-end gap-2">
          <Button asChild size="sm" className="w-full">
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
            <Button asChild size="sm" variant="marketplace" className="w-full">
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
      </div>
    </article>
  );
}

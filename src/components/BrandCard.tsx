import { Link } from "@tanstack/react-router";

import type { Brand } from "@/lib/catalog";

export function BrandCard({ marca }: { marca: Brand }) {
  return (
    <Link
      to="/marcas/$slug"
      params={{ slug: marca.slug }}
      className="card-lift flex h-full flex-col rounded-lg border border-border bg-card p-5"
    >
      <span className="font-display text-xl font-semibold uppercase tracking-wide">
        {marca.nome}
      </span>
      <span className="eyebrow mt-1 text-gold">
        {marca.pais ?? (marca.marcaPropria ? "Marca própria" : "Marca")}
      </span>
      <span className="mt-3 text-xs leading-relaxed text-muted-foreground">
        {marca.descricao ?? `${marca.totalProdutos} produto(s) no catálogo.`}
      </span>
    </Link>
  );
}

export function BrandChip({ marca }: { marca: Brand }) {
  return (
    <Link
      to="/marcas/$slug"
      params={{ slug: marca.slug }}
      className="flex h-20 min-w-[168px] shrink-0 items-center justify-center rounded-lg border border-ink-border bg-ink px-6 font-display text-lg font-semibold uppercase tracking-wider text-ink-foreground transition-colors hover:border-gold hover:text-gold"
    >
      {marca.nome}
    </Link>
  );
}

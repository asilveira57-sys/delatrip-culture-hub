import { Link } from "@tanstack/react-router";
import * as Icons from "lucide-react";

import { categoryMeta, categoryPath, type Category } from "@/lib/catalog";

export function CategoryCard({ categoria }: { categoria: Category }) {
  const meta = categoryMeta(categoria);
  const Icon =
    (Icons[meta.icone as keyof typeof Icons] as Icons.LucideIcon) ??
    Icons.Package;

  return (
    <Link
      to="/catalogo/$"
      params={{ _splat: categoryPath(categoria) }}
      className="card-lift group flex flex-col justify-between rounded-lg border border-border bg-card p-5"
    >
      <span className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <span className="mt-6 block font-display text-lg font-semibold uppercase">
        {categoria.nome}
      </span>
      <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
        {meta.descricao}
      </span>
    </Link>
  );
}

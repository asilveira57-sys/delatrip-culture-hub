import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import type { FC, ReactNode } from "react";

const PlainLink = Link as unknown as FC<{
  to: string;
  className?: string;
  children: ReactNode;
}>;

export type Crumb = { label: string; to?: string };


export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Trilha de navegação" className="mb-6">
      <ol className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
        <li>
          <Link to="/" className="hover:text-primary">
            Início
          </Link>
        </li>
        {items.map((item) => (
          <li key={item.label} className="flex items-center gap-1">
            <ChevronRight className="size-3" aria-hidden="true" />
            {item.to ? (
              <PlainLink to={item.to} className="hover:text-primary">
                {item.label}
              </PlainLink>
            ) : (
              <span className="text-foreground">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

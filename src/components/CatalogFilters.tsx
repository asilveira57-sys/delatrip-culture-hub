import { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { brands, rootCategories, SORT_OPTIONS, type SortKey } from "@/lib/catalog";

export type FiltroValores = {
  q: string;
  categoria: string;
  marca: string;
  ordem: SortKey;
};

export function FilterButton({
  ativo,
  onClick,
  children,
}: {
  ativo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
        ativo
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      }`}
    >
      {children}
    </button>
  );
}

export function SortSelect({
  valor,
  onChange,
}: {
  valor: SortKey;
  onChange: (v: SortKey) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-muted-foreground">
      <span className="sr-only sm:not-sr-only">Ordenar por</span>
      <select
        value={valor}
        onChange={(e) => onChange(e.target.value as SortKey)}
        aria-label="Ordenar produtos"
        className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function ActiveChips({
  chips,
}: {
  chips: { label: string; onRemove: () => void }[];
}) {
  if (chips.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-2">
      {chips.map((c) => (
        <li key={c.label}>
          <button
            type="button"
            onClick={c.onRemove}
            className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs text-primary hover:bg-primary/20"
          >
            {c.label} <span aria-hidden="true">×</span>
            <span className="sr-only">Remover filtro</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

/* ---------------- painel completo de filtros ---------------- */

export function FiltersPanel({
  categoria,
  marca,
  onChange,
}: {
  categoria: string;
  marca: string;
  onChange: (patch: { categoria?: string; marca?: string }) => void;
}) {
  const [termoMarca, setTermoMarca] = useState("");
  const [verTodas, setVerTodas] = useState(false);

  const filtradas = useMemo(() => {
    const t = termoMarca.trim().toLowerCase();
    return t ? brands.filter((b) => b.nome.toLowerCase().includes(t)) : brands;
  }, [termoMarca]);

  const visiveis = verTodas || termoMarca ? filtradas : filtradas.slice(0, 12);

  return (
    <div>
      <h2 className="eyebrow text-primary">Categorias</h2>
      <ul className="mt-3 space-y-1">
        <li>
          <FilterButton ativo={!categoria} onClick={() => onChange({ categoria: "" })}>
            Todas
          </FilterButton>
        </li>
        {rootCategories.map((c) => (
          <li key={c.id}>
            <FilterButton
              ativo={categoria === c.slug}
              onClick={() => onChange({ categoria: c.slug })}
            >
              {c.nome}
            </FilterButton>
          </li>
        ))}
      </ul>

      <h2 className="eyebrow mt-8 text-primary">Marcas</h2>
      <Input
        value={termoMarca}
        onChange={(e) => setTermoMarca(e.target.value)}
        placeholder="Buscar marca"
        aria-label="Buscar marca"
        className="mt-3 h-9"
      />
      <ul className="mt-2 space-y-1">
        <li>
          <FilterButton ativo={!marca} onClick={() => onChange({ marca: "" })}>
            Todas
          </FilterButton>
        </li>
        {visiveis.map((b) => (
          <li key={b.slug}>
            <FilterButton
              ativo={marca === b.slug}
              onClick={() => onChange({ marca: b.slug })}
            >
              {b.nome}
            </FilterButton>
          </li>
        ))}
      </ul>
      {!termoMarca && filtradas.length > 12 && (
        <button
          type="button"
          onClick={() => setVerTodas((v) => !v)}
          className="mt-2 px-3 text-xs text-primary underline underline-offset-4"
        >
          {verTodas ? "Ver menos marcas" : `Ver todas as ${filtradas.length} marcas`}
        </button>
      )}
      {termoMarca && filtradas.length === 0 && (
        <p className="mt-2 px-3 text-xs text-muted-foreground">Nenhuma marca encontrada.</p>
      )}
    </div>
  );
}

import { SORT_OPTIONS, type SortKey } from "@/lib/catalog";

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

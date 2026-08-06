import { PackageOpen } from "lucide-react";

export function EmptyState({
  titulo = "Nada por aqui ainda",
  descricao = "Não encontramos itens para esta seleção. Tente ajustar os filtros.",
  acao,
}: {
  titulo?: string;
  descricao?: string;
  acao?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card px-6 py-16 text-center">
      <PackageOpen className="size-8 text-muted-foreground" aria-hidden="true" />
      <h3 className="mt-4 text-lg font-semibold uppercase">{titulo}</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{descricao}</p>
      {acao ? <div className="mt-6">{acao}</div> : null}
    </div>
  );
}

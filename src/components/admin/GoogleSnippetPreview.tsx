import { cn } from "@/lib/utils";

const coresGoogle = {
  url: "text-emerald-700 dark:text-emerald-500",
  titulo: "text-blue-700 dark:text-blue-400",
};

export function GoogleSnippetPreview({
  url,
  titulo,
  descricao,
  fallbackTitulo,
  fallbackDescricao,
  limiteTitulo = 60,
  limiteDescricao = 155,
  className,
}: {
  url: string;
  titulo: string;
  descricao: string;
  fallbackTitulo?: string;
  fallbackDescricao?: string;
  limiteTitulo?: number;
  limiteDescricao?: number;
  className?: string;
}) {
  const tituloFinal = titulo.trim() || fallbackTitulo || "Título da página";
  const descricaoFinal = descricao.trim() || fallbackDescricao || "Descrição que aparece no resultado de busca.";
  const tituloExcedeu = tituloFinal.length > limiteTitulo;
  const descricaoExcedeu = descricaoFinal.length > limiteDescricao;

  return (
    <div className={cn("rounded-md border border-border bg-background p-3", className)}>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">Pré-visualização no Google</p>
      <p className={cn("mt-2 truncate text-xs", coresGoogle.url)}>{url}</p>
      <p
        className={cn(
          "truncate text-base",
          coresGoogle.titulo,
          tituloExcedeu && "text-destructive",
        )}
        title={tituloExcedeu ? `Título ultrapassa ${limiteTitulo} caracteres` : undefined}
      >
        {tituloFinal}
      </p>
      <p
        className={cn(
          "line-clamp-2 text-sm text-muted-foreground",
          descricaoExcedeu && "text-destructive",
        )}
        title={descricaoExcedeu ? `Descrição ultrapassa ${limiteDescricao} caracteres` : undefined}
      >
        {descricaoFinal}
      </p>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
        <span className={tituloExcedeu ? "text-destructive font-medium" : "text-muted-foreground"}>
          Título: {tituloFinal.length}/{limiteTitulo}
        </span>
        <span className={descricaoExcedeu ? "text-destructive font-medium" : "text-muted-foreground"}>
          Descrição: {descricaoFinal.length}/{limiteDescricao}
        </span>
      </div>
      {(tituloExcedeu || descricaoExcedeu) && (
        <p className="mt-2 text-xs text-destructive">
          {tituloExcedeu && descricaoExcedeu
            ? `Título e descrição ultrapassam os limites recomendados (${limiteTitulo} e ${limiteDescricao} caracteres).`
            : tituloExcedeu
              ? `Título ultrapassa o limite recomendado de ${limiteTitulo} caracteres.`
              : `Descrição ultrapassa o limite recomendado de ${limiteDescricao} caracteres.`}
        </p>
      )}
    </div>
  );
}

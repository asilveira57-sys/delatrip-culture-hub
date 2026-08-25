import { Fragment, type ReactNode } from "react";

import { cn } from "@/lib/utils";

const coresGoogle = {
  url: "text-emerald-700 dark:text-emerald-500",
  titulo: "text-blue-700 dark:text-blue-400",
};

/** Normaliza texto para comparar sem acento e sem caixa. */
function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function termos(keywords: string) {
  return Array.from(
    new Set(
      keywords
        .split(",")
        .map((k) => k.trim())
        .filter((k) => k.length >= 3),
    ),
  ).sort((a, b) => b.length - a.length);
}

/** Marca no texto os trechos que batem com as palavras-chave informadas. */
function destacar(texto: string, keywords: string): ReactNode {
  const lista = termos(keywords);
  if (!lista.length) return texto;

  const base = normalizar(texto);
  const marcado = new Array<boolean>(texto.length).fill(false);

  for (const termo of lista) {
    const alvo = normalizar(termo);
    if (!alvo) continue;
    let de = base.indexOf(alvo);
    while (de !== -1) {
      for (let i = de; i < de + alvo.length && i < marcado.length; i++) marcado[i] = true;
      de = base.indexOf(alvo, de + alvo.length);
    }
  }

  const partes: { texto: string; ativo: boolean }[] = [];
  for (let i = 0; i < texto.length; i++) {
    const ativo = !!marcado[i];
    const ultimo = partes[partes.length - 1];
    if (ultimo && ultimo.ativo === ativo) ultimo.texto += texto[i];
    else partes.push({ texto: texto[i] ?? "", ativo });
  }

  return partes.map((parte, i) =>
    parte.ativo ? (
      <mark
        key={i}
        className="rounded bg-primary/15 px-0.5 font-semibold text-foreground dark:bg-primary/30"
      >
        {parte.texto}
      </mark>
    ) : (
      <Fragment key={i}>{parte.texto}</Fragment>
    ),
  );
}

export function GoogleSnippetPreview({
  url,
  titulo,
  descricao,
  keywords = "",
  fallbackTitulo,
  fallbackDescricao,
  limiteTitulo = 60,
  limiteDescricao = 155,
  className,
}: {
  url: string;
  titulo: string;
  descricao: string;
  keywords?: string;
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
  const listaTermos = termos(keywords);
  const baseTitulo = normalizar(tituloFinal);
  const baseDescricao = normalizar(descricaoFinal);
  const ausentes = listaTermos.filter((t) => {
    const alvo = normalizar(t);
    return !baseTitulo.includes(alvo) && !baseDescricao.includes(alvo);
  });

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
        {destacar(tituloFinal, keywords)}
      </p>
      <p
        className={cn(
          "line-clamp-2 text-sm text-muted-foreground",
          descricaoExcedeu && "text-destructive",
        )}
        title={descricaoExcedeu ? `Descrição ultrapassa ${limiteDescricao} caracteres` : undefined}
      >
        {destacar(descricaoFinal, keywords)}
      </p>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
        <span className={tituloExcedeu ? "text-destructive font-medium" : "text-muted-foreground"}>
          Título: {tituloFinal.length}/{limiteTitulo}
        </span>
        <span className={descricaoExcedeu ? "text-destructive font-medium" : "text-muted-foreground"}>
          Descrição: {descricaoFinal.length}/{limiteDescricao}
        </span>
        {listaTermos.length > 0 && (
          <span className="text-muted-foreground">
            Palavras-chave presentes: {listaTermos.length - ausentes.length}/{listaTermos.length}
          </span>
        )}
      </div>
      {ausentes.length > 0 && (
        <p className="mt-2 text-xs text-muted-foreground">
          Sem destaque (não aparecem no título nem na descrição): {ausentes.join(", ")}
        </p>
      )}
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

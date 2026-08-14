import { sanitizarHtml } from "@/lib/sanitize";

export type Blocos = Record<string, unknown>;

export type FaqItem = { pergunta: string; resposta: string; categoria?: string };

/** Lê um campo de texto dos blocos, caindo para o conteúdo codificado. */
export function texto(blocos: Blocos | null | undefined, chave: string, padrao: string) {
  const valor = blocos?.[chave];
  return typeof valor === "string" && valor.trim() ? valor : padrao;
}

/** Lê um campo rich text já sanitizado; vazio significa "usar o padrão". */
export function rich(blocos: Blocos | null | undefined, chave: string): string | null {
  const valor = blocos?.[chave];
  if (typeof valor !== "string") return null;
  const limpo = sanitizarHtml(valor);
  return limpo.replace(/<[^>]+>/g, "").trim() ? limpo : null;
}

export function lista<T = Record<string, string>>(
  blocos: Blocos | null | undefined,
  chave: string,
  padrao: T[],
): T[] {
  const valor = blocos?.[chave];
  return Array.isArray(valor) && valor.length > 0 ? (valor as T[]) : padrao;
}

export function itensFaq(blocos: Blocos | null | undefined): FaqItem[] {
  const valor = blocos?.["itens"];
  if (!Array.isArray(valor)) return [];
  return valor
    .filter((i): i is FaqItem => !!i && typeof i === "object" && "pergunta" in i)
    .map((i) => ({
      pergunta: String(i.pergunta ?? ""),
      resposta: sanitizarHtml(String(i.resposta ?? "")),
      ...(i.categoria ? { categoria: String(i.categoria) } : {}),
    }))
    .filter((i) => i.pergunta.trim());
}

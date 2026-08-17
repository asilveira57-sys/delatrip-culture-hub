/**
 * Núcleo do gerador automático de SEO (título, descrição e palavras-chave).
 *
 * Vale a mesma regra do enriquecedor de produtos: o modelo só pode resumir o
 * que já está no conteúdo enviado. Nada de inventar fato, preço ou promessa,
 * e nada de citar derivados do tabaco (RDC ANVISA nº 558/2021).
 */

export const MODELO_SEO = "google/gemini-2.5-flash";

export type TipoSeo = "produto" | "post" | "pagina";

export type SeoGerado = {
  titulo: string;
  descricao: string;
  keywords: string;
};

export const LIMITE_TITULO = 60;
export const LIMITE_DESCRICAO = 155;

export const INSTRUCAO_SEO = `Você é especialista em SEO para um portal institucional brasileiro de acessórios (head shop DeLaTrip).
Gere metadados em português do Brasil a partir APENAS do conteúdo enviado.

Regras obrigatórias:
- Nunca invente fato, medida, material, preço, promoção, prazo ou avaliação.
- Nunca cite tabaco, cigarro, charuto, nicotina, fumo, maconha, cannabis, THC, drogas ou uso medicinal.
- Nunca prometa compra, frete ou entrega: o site é institucional e de catálogo, não é loja.
- Título: até ${LIMITE_TITULO} caracteres, específico, sem clickbait, sem aspas, sem emoji.
- Descrição: 120 a ${LIMITE_DESCRICAO} caracteres, uma frase clara que descreva a página.
- Palavras-chave: 5 a 8 termos reais do conteúdo, minúsculos, separados por vírgula.

Responda SOMENTE com JSON válido no formato:
{"titulo":"...","descricao":"...","keywords":"..."}`;

const ROTULO: Record<TipoSeo, string> = {
  produto: "Página de produto do catálogo",
  post: "Artigo do blog",
  pagina: "Página institucional",
};

export function promptSeo(entrada: {
  tipo: TipoSeo;
  titulo: string;
  contexto: string;
  extra?: string | null;
}) {
  return [
    `${ROTULO[entrada.tipo]} do site DeLaTrip.`,
    `Título/H1: ${entrada.titulo}`,
    entrada.extra ? `Contexto adicional: ${entrada.extra}` : null,
    "Conteúdo da página:",
    limparConteudo(entrada.contexto).slice(0, 6000) || "(sem conteúdo textual)",
  ]
    .filter(Boolean)
    .join("\n\n");
}

/** Remove marcação e espaços redundantes antes de mandar para o modelo. */
export function limparConteudo(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function corta(texto: string, limite: number) {
  const limpo = texto.replace(/\s+/g, " ").trim().replace(/^["'“”]|["'“”]$/g, "");
  if (limpo.length <= limite) return limpo;
  const cortado = limpo.slice(0, limite);
  const espaco = cortado.lastIndexOf(" ");
  return (espaco > limite * 0.6 ? cortado.slice(0, espaco) : cortado).trim();
}

/** Lê a resposta do modelo mesmo quando vem embrulhada em ```json. */
export function interpretarSeo(bruto: string): SeoGerado | null {
  const texto = bruto
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  const inicio = texto.indexOf("{");
  const fim = texto.lastIndexOf("}");
  if (inicio < 0 || fim <= inicio) return null;
  try {
    const json = JSON.parse(texto.slice(inicio, fim + 1)) as Record<string, unknown>;
    const keywords = Array.isArray(json["keywords"])
      ? (json["keywords"] as unknown[]).join(", ")
      : String(json["keywords"] ?? "");
    const resultado: SeoGerado = {
      titulo: corta(String(json["titulo"] ?? ""), LIMITE_TITULO),
      descricao: corta(String(json["descricao"] ?? ""), LIMITE_DESCRICAO),
      keywords: keywords
        .split(",")
        .map((k) => k.trim().toLowerCase())
        .filter(Boolean)
        .slice(0, 8)
        .join(", "),
    };
    return resultado.titulo && resultado.descricao ? resultado : null;
  } catch {
    return null;
  }
}

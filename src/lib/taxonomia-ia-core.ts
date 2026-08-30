/**
 * Sugestão de tags e cluster SEO por IA.
 *
 * Vale a mesma regra do resto do sistema: o modelo só pode extrair termos que
 * já estão no conteúdo, sem inventar fato e sem citar derivados do tabaco
 * (RDC ANVISA nº 558/2021).
 */

export const MODELO_TAXONOMIA = "google/gemini-2.5-flash";

export type TaxonomiaSugerida = {
  tags: string[];
  cluster: string;
};

export const INSTRUCAO_TAXONOMIA = `Você organiza a taxonomia editorial de um portal institucional brasileiro (head shop DeLaTrip).
A partir APENAS do conteúdo enviado, sugira tags e um cluster temático em português do Brasil.

Regras obrigatórias:
- Nunca invente tema que não esteja no texto.
- Nunca cite tabaco, cigarro, charuto, nicotina, fumo, maconha, cannabis, THC, drogas ou uso medicinal.
- Tags: 4 a 8 termos curtos (1 a 3 palavras), minúsculos, sem hashtag, sem repetição.
- Cluster: um único tema guarda-chuva, 1 a 3 palavras, com inicial maiúscula.

Responda SOMENTE com JSON válido no formato:
{"tags":["...","..."],"cluster":"..."}`;

export function promptTaxonomia(entrada: {
  titulo: string;
  contexto: string;
  clustersExistentes: string[];
}) {
  return [
    `Título do artigo: ${entrada.titulo}`,
    entrada.clustersExistentes.length > 0
      ? `Clusters já existentes (reutilize um deles quando fizer sentido): ${entrada.clustersExistentes.join(", ")}`
      : null,
    "Conteúdo:",
    entrada.contexto
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 6000) || "(sem conteúdo textual)",
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function interpretarTaxonomia(bruto: string): TaxonomiaSugerida {
  const texto = bruto.trim().replace(/^```(?:json)?|```$/g, "");
  const inicio = texto.indexOf("{");
  const fim = texto.lastIndexOf("}");
  if (inicio < 0 || fim <= inicio) return { tags: [], cluster: "" };
  try {
    const json = JSON.parse(texto.slice(inicio, fim + 1)) as {
      tags?: unknown;
      cluster?: unknown;
    };
    const tags = Array.isArray(json.tags)
      ? [
          ...new Set(
            json.tags
              .map((t) => String(t).trim().toLowerCase())
              .filter((t) => t.length >= 3 && t.length <= 40),
          ),
        ].slice(0, 8)
      : [];
    const cluster = typeof json.cluster === "string" ? json.cluster.trim().slice(0, 60) : "";
    return { tags, cluster };
  } catch {
    return { tags: [], cluster: "" };
  }
}

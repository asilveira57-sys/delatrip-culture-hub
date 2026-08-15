/**
 * Núcleo do enriquecedor de textos.
 *
 * A instrução é SUBTRATIVA e ORGANIZADORA: o modelo só pode reescrever,
 * limpar e estruturar o que já existe na descrição da Tray. Inventar fato,
 * medida, material ou benefício é falha. As verificações abaixo rodam sempre
 * — no servidor, depois da geração — e reprovam o texto automaticamente.
 */

export const MODELO_PADRAO = "google/gemini-2.5-flash";

/** Preço por 1 milhão de tokens (USD) — usado só para estimar o custo. */
export const PRECO_TOKEN: Record<string, { entrada: number; saida: number }> = {
  "google/gemini-2.5-flash": { entrada: 0.3, saida: 2.5 },
  "google/gemini-2.5-flash-lite": { entrada: 0.1, saida: 0.4 },
  "google/gemini-2.5-pro": { entrada: 1.25, saida: 10 },
};

export const MODELOS = [
  { id: "google/gemini-2.5-flash", label: "Gemini Flash (equilíbrio)" },
  { id: "google/gemini-2.5-flash-lite", label: "Gemini Flash Lite (barato)" },
  { id: "google/gemini-2.5-pro", label: "Gemini Pro (mais caro)" },
] as const;

export function custoEstimado(
  modelo: string,
  tokensEntrada: number,
  tokensSaida: number,
) {
  const p = PRECO_TOKEN[modelo] ?? PRECO_TOKEN[MODELO_PADRAO]!;
  return (tokensEntrada * p.entrada + tokensSaida * p.saida) / 1_000_000;
}

/**
 * Termos que não podem aparecer no texto de um produto do catálogo.
 * A RDC ANVISA nº 558/2021 e a Lei nº 9.294/1996 proíbem propaganda e venda
 * de derivados do tabaco pela internet; acessórios não podem ser descritos
 * como destinados ao consumo de tabaco ou de substâncias ilícitas.
 */
export const TERMOS_PROIBIDOS = [
  "tabaco",
  "cigarro",
  "cigarrilha",
  "charuto",
  "nicotina",
  "fumo",
  "fumar",
  "maconha",
  "cannabis",
  "thc",
  "erva ilícita",
  "entorpecente",
  "droga",
  "cura",
  "terapêutico",
  "medicinal",
  "emagrec",
  "melhor do mercado",
  "o mais barato",
  "frete grátis",
  "promoção imperdível",
];

export const LIMITE_MINIMO = 200;
export const LIMITE_MAXIMO = 1600;
export const SIMILARIDADE_MINIMA = 0.25;

export const INSTRUCAO_SISTEMA = `Você reescreve descrições de produtos de uma tabacaria/head shop brasileira (DeLaTrip). O site é institucional e de catálogo — não vende pela internet.

REGRAS ABSOLUTAS
1. Trabalho SUBTRATIVO e ORGANIZADOR: use apenas informações presentes no texto de origem. É PROIBIDO inventar, estimar ou completar qualquer fato, medida, material, quantidade, origem, composição ou benefício.
2. Se um dado não estiver na origem, simplesmente não o mencione. Nunca escreva "aproximadamente", "cerca de" ou faixas inventadas.
3. Todos os números (medidas, gramaturas, quantidades, unidades) devem aparecer exatamente como na origem. Não converta unidades.
4. PROIBIDO citar tabaco, cigarro, charuto, fumo, nicotina, maconha, cannabis, THC ou qualquer substância ilícita, e proibido sugerir que o produto se destina a consumi-las.
5. PROIBIDO alegação de saúde, terapêutica ou medicinal, superlativos publicitários ("melhor do mercado"), preço, frete, prazo ou chamada de compra.
6. Português do Brasil, tom informativo e sóbrio, segunda pessoa evitada.

FORMATO DE SAÍDA
HTML simples, sem markdown e sem <html>/<body>. Use apenas <p>, <h3>, <ul> e <li> e <strong>.
Estrutura: um parágrafo de apresentação (2 a 4 frases); quando houver dados suficientes, uma lista <ul> de características objetivas; opcionalmente um parágrafo final de uso geral.
Entre 200 e 1200 caracteres. Responda somente com o HTML.`;

export function promptDoProduto(p: {
  nome: string;
  marca?: string | null;
  categoria?: string | null;
  descricaoOriginal: string;
}) {
  return `NOME: ${p.nome}
MARCA: ${p.marca ?? "não informada"}
CATEGORIA: ${p.categoria ?? "não informada"}

TEXTO DE ORIGEM (única fonte de fatos permitida):
"""
${p.descricaoOriginal}
"""`;
}

/* ---------------- verificações automáticas ---------------- */

export function textoPuro(html: string) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** Números com no máximo uma vírgula/ponto decimal, normalizados. */
export function numerosDe(texto: string): string[] {
  const achados = texto.match(/\d+(?:[.,]\d+)?/g) ?? [];
  return achados.map((n) => n.replace(",", ".").replace(/\.0+$/, ""));
}

function trigramas(texto: string) {
  const limpo = texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
  const set = new Set<string>();
  for (let i = 0; i + 3 <= limpo.length; i++) set.add(limpo.slice(i, i + 3));
  return set;
}

/** Jaccard de trigramas: 0 = nada em comum, 1 = idêntico. */
export function similaridade(a: string, b: string) {
  const ta = trigramas(a);
  const tb = trigramas(b);
  if (ta.size === 0 || tb.size === 0) return 0;
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter++;
  return inter / (ta.size + tb.size - inter);
}

export type Verificacao = {
  aprovado: boolean;
  motivos: string[];
  similaridade: number;
  caracteres: number;
};

/** Reprova o texto quando qualquer checagem objetiva falha. */
export function verificarTexto(
  original: string,
  gerado: string,
): Verificacao {
  const motivos: string[] = [];
  const puroOrigem = textoPuro(original);
  const puroGerado = textoPuro(gerado);

  const caracteres = puroGerado.length;
  if (caracteres < LIMITE_MINIMO) motivos.push("Texto curto demais");
  if (caracteres > LIMITE_MAXIMO) motivos.push("Texto longo demais");

  const origem = new Set(numerosDe(puroOrigem));
  const inventados = [...new Set(numerosDe(puroGerado))].filter(
    (n) => !origem.has(n),
  );
  if (inventados.length > 0)
    motivos.push(`Números fora da origem: ${inventados.join(", ")}`);

  const baixo = puroGerado.toLowerCase();
  const proibidos = TERMOS_PROIBIDOS.filter((t) => baixo.includes(t));
  if (proibidos.length > 0)
    motivos.push(`Termos proibidos: ${proibidos.join(", ")}`);

  const sim = similaridade(puroOrigem, puroGerado);
  if (puroOrigem.length > 120 && sim < SIMILARIDADE_MINIMA)
    motivos.push("Pouca aderência ao texto de origem");

  if (/<(script|style|html|body)/i.test(gerado))
    motivos.push("HTML com tags não permitidas");

  return {
    aprovado: motivos.length === 0,
    motivos,
    similaridade: Number(sim.toFixed(3)),
    caracteres,
  };
}

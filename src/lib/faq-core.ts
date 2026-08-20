/**
 * Núcleo da FAQ por conteúdo (post, produto e marca).
 *
 * A IA apenas SUGERE perguntas e respostas a partir do texto já existente.
 * Nada é publicado sem aprovação humana no admin.
 */

import { sanitizarHtml } from "@/lib/sanitize";

export const MODELO_FAQ = "google/gemini-2.5-flash";

export type TipoFaq = "post" | "produto" | "marca";

export type FaqLinha = {
  id?: string;
  pergunta: string;
  resposta: string;
  ordem: number;
  origem?: string;
};

export const LIMITE_PERGUNTA = 120;
export const LIMITE_RESPOSTA = 600;
export const MAX_ITENS = 8;

export const INSTRUCAO_FAQ = `Você escreve perguntas frequentes (FAQ) em português do Brasil para o portal institucional DeLaTrip (catálogo de acessórios, não é loja online).

Regras obrigatórias:
- Baseie-se APENAS no conteúdo enviado. Nunca invente fato, medida, material, preço, prazo, promoção ou avaliação.
- Se o conteúdo não sustenta uma resposta, não crie a pergunta.
- Nunca cite tabaco, cigarro, charuto, nicotina, fumo, maconha, cannabis, THC, drogas ou uso medicinal.
- Nunca prometa compra, frete, entrega ou desconto: o site é institucional.
- Perguntas: até ${LIMITE_PERGUNTA} caracteres, na voz de quem pesquisa no Google.
- Respostas: 1 a 3 frases, texto simples, até ${LIMITE_RESPOSTA} caracteres, sem HTML.
- Gere de 3 a ${MAX_ITENS} itens, sem repetir assunto.

Responda SOMENTE com JSON válido no formato:
{"itens":[{"pergunta":"...","resposta":"..."}]}`;

const ROTULO: Record<TipoFaq, string> = {
  post: "Artigo do blog",
  produto: "Página de produto do catálogo",
  marca: "Página institucional de marca",
};

export function limparConteudoFaq(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function promptFaq(entrada: {
  tipo: TipoFaq;
  titulo: string;
  contexto: string;
  extra?: string | null;
}) {
  return [
    `${ROTULO[entrada.tipo]} do site DeLaTrip.`,
    `Título/H1: ${entrada.titulo}`,
    entrada.extra ? `Contexto adicional: ${entrada.extra}` : null,
    "Conteúdo da página:",
    limparConteudoFaq(entrada.contexto).slice(0, 8000) || "(sem conteúdo textual)",
  ]
    .filter(Boolean)
    .join("\n\n");
}

function corta(texto: string, limite: number) {
  const limpo = texto.replace(/\s+/g, " ").trim().replace(/^["'“”]|["'“”]$/g, "");
  if (limpo.length <= limite) return limpo;
  const cortado = limpo.slice(0, limite);
  const espaco = cortado.lastIndexOf(" ");
  return `${(espaco > limite * 0.6 ? cortado.slice(0, espaco) : cortado).trim()}…`;
}

/** Lê a resposta do modelo mesmo quando vem embrulhada em ```json. */
export function interpretarFaq(bruto: string): { pergunta: string; resposta: string }[] {
  const texto = bruto.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  const inicio = texto.indexOf("{");
  const fim = texto.lastIndexOf("}");
  if (inicio < 0 || fim <= inicio) return [];
  try {
    const json = JSON.parse(texto.slice(inicio, fim + 1)) as { itens?: unknown };
    if (!Array.isArray(json.itens)) return [];
    return json.itens
      .map((i) => {
        const item = (i ?? {}) as Record<string, unknown>;
        return {
          pergunta: corta(String(item["pergunta"] ?? ""), LIMITE_PERGUNTA),
          resposta: corta(String(item["resposta"] ?? ""), LIMITE_RESPOSTA),
        };
      })
      .filter((i) => i.pergunta.length > 5 && i.resposta.length > 15)
      .slice(0, MAX_ITENS);
  } catch {
    return [];
  }
}

export function normalizarLinhas(linhas: FaqLinha[]): FaqLinha[] {
  return linhas
    .map((l, i) => ({
      ...l,
      pergunta: l.pergunta.trim(),
      resposta: sanitizarHtml(l.resposta.trim()),
      ordem: i,
    }))
    .filter((l) => l.pergunta && l.resposta);
}

/** JSON-LD FAQPage a partir dos itens aprovados. */
export function faqLd(itens: { pergunta: string; resposta: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: itens.map((item) => ({
      "@type": "Question",
      name: item.pergunta,
      acceptedAnswer: {
        "@type": "Answer",
        text: limparConteudoFaq(item.resposta),
      },
    })),
  };
}

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const entrada = z.object({
  tipo: z.enum(["posts", "produtos"]),
  produto: z.object({
    nome: z.string().min(1).max(300),
    categoria: z.string().max(300).nullable().optional(),
    marca: z.string().max(200).nullable().optional(),
    descricao: z.string().max(4000).default(""),
  }),
  candidatos: z
    .array(z.object({ id: z.string().min(1).max(300), texto: z.string().max(600) }))
    .min(1)
    .max(200),
  maximo: z.number().int().min(1).max(8),
});

export type SugestaoRelacionado = { id: string; motivo: string };
export type ResultadoRelacionadosIa = {
  ok: boolean;
  itens: SugestaoRelacionado[];
  erro?: string;
};

const INSTRUCAO = `Você ajuda a curadoria de um catálogo de acessórios (portal institucional, não é loja).
Escolha itens da lista de candidatos que realmente tenham relação com o produto informado.
Regras:
- Use apenas IDs que estão na lista. Nunca invente IDs ou títulos.
- Se nenhum candidato tiver relação clara, devolva lista vazia.
- Motivo: uma frase curta em português (até 120 caracteres), falando só de formato, material, uso ou organização.
- Não mencione substâncias, efeitos no organismo, saúde, tabaco, nicotina ou fumo.
- Para produtos: prefira itens complementares (que se usam junto) em vez de variações do mesmo item.
Responda somente com JSON: {"itens":[{"id":"...","motivo":"..."}]}`;

/** Sugere posts ou produtos relacionados a um produto, só entre os candidatos enviados. */
export const sugerirRelacionadosIa = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => entrada.parse(data))
  .handler(async ({ data }): Promise<ResultadoRelacionadosIa> => {
    const vazio: ResultadoRelacionadosIa = { ok: false, itens: [] };
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) return { ...vazio, erro: "Serviço de IA indisponível." };

    const p = data.produto;
    const prompt = [
      `Tipo de sugestão: ${data.tipo === "posts" ? "posts do blog" : "produtos"}`,
      data.tipo === "produtos"
        ? `Escolha exatamente ${data.maximo} produtos (ou o máximo possível), montando uma vitrine útil para quem vê este produto: itens que se usam junto, que guardam/organizam ou que completam o kit. Varie as categorias; no máximo 2 do mesmo tipo do produto.`
        : `Escolha no máximo ${data.maximo}.`,
      `Produto: ${p.nome}`,
      p.categoria ? `Categoria: ${p.categoria}` : "",
      p.marca ? `Marca: ${p.marca}` : "",
      p.descricao ? `Descrição: ${p.descricao}` : "",
      "",
      "Candidatos (id | texto):",
      ...data.candidatos.map((c) => `${c.id} | ${c.texto}`),
    ]
      .filter(Boolean)
      .join("\n");

    try {
      const resposta = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "openai/gpt-6-astra",
          reasoning_effort: "low",
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: INSTRUCAO },
            { role: "user", content: prompt },
          ],
        }),
      });
      if (resposta.status === 429)
        return { ...vazio, erro: "Limite de requisições atingido. Tente em instantes." };
      if (resposta.status === 402) return { ...vazio, erro: "Créditos de IA esgotados." };
      if (resposta.status === 403) return { ...vazio, erro: "Uso de IA bloqueado no momento." };
      if (!resposta.ok) {
        console.error("IA relacionados", resposta.status, await resposta.text());
        return { ...vazio, erro: "Falha ao gerar sugestões." };
      }
      const json = (await resposta.json()) as { choices?: { message?: { content?: string } }[] };
      const texto = json.choices?.[0]?.message?.content ?? "";
      const bruto = texto.slice(texto.indexOf("{"), texto.lastIndexOf("}") + 1);
      const parsed = z
        .object({
          itens: z.array(z.object({ id: z.string(), motivo: z.string().default("") })),
        })
        .safeParse(JSON.parse(bruto || "{}"));
      if (!parsed.success) return { ...vazio, erro: "Resposta da IA inválida." };
      const validos = new Set(data.candidatos.map((c) => c.id));
      const vistos = new Set<string>();
      const itens = parsed.data.itens
        .filter((i) => validos.has(i.id) && !vistos.has(i.id) && vistos.add(i.id))
        .slice(0, data.maximo)
        .map((i) => ({ id: i.id, motivo: i.motivo.slice(0, 160) }));
      return { ok: true, itens };
    } catch (e) {
      console.error(e);
      return { ...vazio, erro: "Falha de rede ao chamar a IA." };
    }
  });

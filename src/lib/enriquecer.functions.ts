import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  INSTRUCAO_SISTEMA,
  MODELO_PADRAO,
  custoEstimado,
  promptDoProduto,
  verificarTexto,
} from "@/lib/enriquecer-core";

const entrada = z.object({
  slug: z.string().min(1).max(200),
  nome: z.string().min(1).max(300),
  marca: z.string().max(200).nullable().optional(),
  categoria: z.string().max(200).nullable().optional(),
  descricaoOriginal: z.string().max(20000),
  modelo: z.string().max(80).optional(),
});

export type ResultadoEnriquecimento = {
  slug: string;
  ok: boolean;
  aprovado: boolean;
  motivos: string[];
  html: string;
  similaridade: number;
  caracteres: number;
  custo: number;
  erro?: string;
};

/** Reescreve a descrição de um produto e grava o resultado na sobreposição. */
export const enriquecerProduto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => entrada.parse(data))
  .handler(async ({ data, context }): Promise<ResultadoEnriquecimento> => {
    const modelo = data.modelo || MODELO_PADRAO;
    const vazio: ResultadoEnriquecimento = {
      slug: data.slug,
      ok: false,
      aprovado: false,
      motivos: [],
      html: "",
      similaridade: 0,
      caracteres: 0,
      custo: 0,
    };

    const origem = data.descricaoOriginal.trim();
    if (origem.replace(/<[^>]+>/g, "").trim().length < 40) {
      return { ...vazio, erro: "Descrição de origem curta demais para reescrever." };
    }

    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) return { ...vazio, erro: "Serviço de IA indisponível." };

    let html = "";
    let tokensEntrada = 0;
    let tokensSaida = 0;

    try {
      const resposta = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: modelo,
          messages: [
            { role: "system", content: INSTRUCAO_SISTEMA },
            {
              role: "user",
              content: promptDoProduto({
                nome: data.nome,
                marca: data.marca ?? null,
                categoria: data.categoria ?? null,
                descricaoOriginal: origem,
              }),
            },
          ],
        }),
      });

      if (resposta.status === 429)
        return { ...vazio, erro: "Limite de requisições atingido. Tente em instantes." };
      if (resposta.status === 402)
        return { ...vazio, erro: "Créditos de IA esgotados." };
      if (!resposta.ok) {
        console.error("IA gateway", resposta.status, await resposta.text());
        return { ...vazio, erro: "Falha ao gerar o texto." };
      }

      const json = (await resposta.json()) as {
        choices?: { message?: { content?: string } }[];
        usage?: { prompt_tokens?: number; completion_tokens?: number };
      };
      html = (json.choices?.[0]?.message?.content ?? "")
        .replace(/^```(?:html)?/i, "")
        .replace(/```$/, "")
        .trim();
      tokensEntrada = json.usage?.prompt_tokens ?? 0;
      tokensSaida = json.usage?.completion_tokens ?? 0;
    } catch (e) {
      console.error(e);
      return { ...vazio, erro: "Falha de rede ao chamar a IA." };
    }

    if (!html) return { ...vazio, erro: "A IA devolveu texto vazio." };

    const check = verificarTexto(origem, html);
    const custo = custoEstimado(modelo, tokensEntrada, tokensSaida);

    const { error } = await context.supabase.from("produto_overlay").upsert(
      {
        slug: data.slug,
        descricao_html: html,
        descricao_original: origem,
        enriquecido_em: new Date().toISOString(),
        enriquecido_modelo: modelo,
        status_revisao: "pendente",
        observacao: check.motivos.join(" · ") || null,
      },
      { onConflict: "slug" },
    );
    if (error) console.error(error);

    await context.supabase.from("enriquecimento_log").insert({
      slug: data.slug,
      modelo,
      tokens_entrada: tokensEntrada,
      tokens_saida: tokensSaida,
      custo_usd: Number(custo.toFixed(6)),
      aprovado: check.aprovado,
      motivos: check.motivos,
    });

    return {
      slug: data.slug,
      ok: true,
      aprovado: check.aprovado,
      motivos: check.motivos,
      html,
      similaridade: check.similaridade,
      caracteres: check.caracteres,
      custo,
    };
  });

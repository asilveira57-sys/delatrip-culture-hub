import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  INSTRUCAO_TAXONOMIA,
  MODELO_TAXONOMIA,
  interpretarTaxonomia,
  promptTaxonomia,
} from "@/lib/taxonomia-ia-core";

const entrada = z.object({
  titulo: z.string().min(1).max(300),
  contexto: z.string().max(40000).default(""),
  clustersExistentes: z.array(z.string().max(80)).max(50).default([]),
});

export type ResultadoTaxonomiaIa = {
  ok: boolean;
  tags: string[];
  cluster: string;
  erro?: string;
};

/** Sugere tags e cluster SEO a partir do conteúdo — nada é salvo aqui. */
export const gerarTaxonomiaIa = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => entrada.parse(data))
  .handler(async ({ data }): Promise<ResultadoTaxonomiaIa> => {
    const vazio: ResultadoTaxonomiaIa = { ok: false, tags: [], cluster: "" };

    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) return { ...vazio, erro: "Serviço de IA indisponível." };

    try {
      const resposta = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: MODELO_TAXONOMIA,
          messages: [
            { role: "system", content: INSTRUCAO_TAXONOMIA },
            { role: "user", content: promptTaxonomia(data) },
          ],
        }),
      });

      if (resposta.status === 429)
        return { ...vazio, erro: "Limite de requisições atingido. Tente em instantes." };
      if (resposta.status === 402) return { ...vazio, erro: "Créditos de IA esgotados." };
      if (!resposta.ok) {
        console.error("IA gateway taxonomia", resposta.status, await resposta.text());
        return { ...vazio, erro: "Falha ao sugerir tags e cluster." };
      }

      const json = (await resposta.json()) as { choices?: { message?: { content?: string } }[] };
      const sugestao = interpretarTaxonomia(json.choices?.[0]?.message?.content ?? "");
      if (sugestao.tags.length === 0 && !sugestao.cluster)
        return { ...vazio, erro: "A IA não conseguiu sugerir a taxonomia." };
      return { ok: true, ...sugestao };
    } catch (e) {
      console.error(e);
      return { ...vazio, erro: "Falha de rede ao chamar a IA." };
    }
  });

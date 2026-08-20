import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { INSTRUCAO_FAQ, MODELO_FAQ, interpretarFaq, promptFaq } from "@/lib/faq-core";

const entrada = z.object({
  tipo: z.enum(["post", "produto", "marca"]),
  titulo: z.string().min(1).max(300),
  contexto: z.string().max(40000).default(""),
  extra: z.string().max(500).nullable().optional(),
});

export type ResultadoFaqIa = {
  ok: boolean;
  itens: { pergunta: string; resposta: string }[];
  erro?: string;
};

/** Sugere perguntas e respostas a partir do conteúdo (sem publicar nada). */
export const gerarFaqIa = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => entrada.parse(data))
  .handler(async ({ data }): Promise<ResultadoFaqIa> => {
    const vazio: ResultadoFaqIa = { ok: false, itens: [] };

    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) return { ...vazio, erro: "Serviço de IA indisponível." };

    try {
      const resposta = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: MODELO_FAQ,
          messages: [
            { role: "system", content: INSTRUCAO_FAQ },
            {
              role: "user",
              content: promptFaq({
                tipo: data.tipo,
                titulo: data.titulo,
                contexto: data.contexto,
                extra: data.extra ?? null,
              }),
            },
          ],
        }),
      });

      if (resposta.status === 429)
        return { ...vazio, erro: "Limite de requisições atingido. Tente em instantes." };
      if (resposta.status === 402) return { ...vazio, erro: "Créditos de IA esgotados." };
      if (!resposta.ok) {
        console.error("IA gateway faq", resposta.status, await resposta.text());
        return { ...vazio, erro: "Falha ao gerar a FAQ." };
      }

      const json = (await resposta.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const itens = interpretarFaq(json.choices?.[0]?.message?.content ?? "");
      if (itens.length === 0) return { ...vazio, erro: "A IA não conseguiu sugerir perguntas." };
      return { ok: true, itens };
    } catch (e) {
      console.error(e);
      return { ...vazio, erro: "Falha de rede ao chamar a IA." };
    }
  });

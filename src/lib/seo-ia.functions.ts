import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  INSTRUCAO_SEO,
  MODELO_SEO,
  interpretarSeo,
  promptSeo,
  type SeoGerado,
} from "@/lib/seo-ia-core";

const entrada = z.object({
  tipo: z.enum(["produto", "post", "pagina"]),
  titulo: z.string().min(1).max(300),
  contexto: z.string().max(40000).default(""),
  extra: z.string().max(500).nullable().optional(),
});

export type ResultadoSeoIa = SeoGerado & { ok: boolean; erro?: string };

/** Gera título, descrição e palavras-chave de SEO a partir do conteúdo. */
export const gerarSeoIa = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => entrada.parse(data))
  .handler(async ({ data }): Promise<ResultadoSeoIa> => {
    const vazio: ResultadoSeoIa = { ok: false, titulo: "", descricao: "", keywords: "" };

    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) return { ...vazio, erro: "Serviço de IA indisponível." };

    try {
      const resposta = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: MODELO_SEO,
          messages: [
            { role: "system", content: INSTRUCAO_SEO },
            {
              role: "user",
              content: promptSeo({
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
        console.error("IA gateway seo", resposta.status, await resposta.text());
        return { ...vazio, erro: "Falha ao gerar o SEO." };
      }

      const json = (await resposta.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const seo = interpretarSeo(json.choices?.[0]?.message?.content ?? "");
      if (!seo) return { ...vazio, erro: "A IA devolveu uma resposta inválida." };
      return { ok: true, ...seo };
    } catch (e) {
      console.error(e);
      return { ...vazio, erro: "Falha de rede ao chamar a IA." };
    }
  });

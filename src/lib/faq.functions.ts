import { createServerFn } from "@tanstack/react-start";

import type { TipoFaq } from "@/lib/faq-core";
import { clientePublico } from "@/lib/public-db.server";

export type FaqPublico = { pergunta: string; resposta: string };

/** FAQ aprovada de um conteúdo; lista vazia quando não há banco ou registro. */
export const carregarFaq = createServerFn({ method: "GET" })
  .inputValidator((entrada: { tipo: TipoFaq; alvo: string }) => entrada)
  .handler(async ({ data: entrada }): Promise<FaqPublico[]> => {
    const supabase = clientePublico();
    if (!supabase) return [];
    try {
      const { data, error } = await supabase
        .from("faq_item")
        .select("pergunta, resposta, ordem")
        .eq("tipo", entrada.tipo)
        .eq("alvo", entrada.alvo)
        .order("ordem", { ascending: true })
        .limit(20);
      if (error || !data) return [];
      return data.map((l) => ({
        pergunta: l.pergunta as string,
        resposta: l.resposta as string,
      }));
    } catch {
      return [];
    }
  });

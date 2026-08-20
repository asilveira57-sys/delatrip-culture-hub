import { supabase } from "@/integrations/supabase/client";

import { normalizarLinhas, type FaqLinha, type TipoFaq } from "@/lib/faq-core";

/** Itens de FAQ salvos para um conteúdo, na ordem definida no admin. */
export async function listarFaqAdmin(tipo: TipoFaq, alvo: string): Promise<FaqLinha[]> {
  const { data, error } = await supabase
    .from("faq_item")
    .select("id, pergunta, resposta, ordem, origem")
    .eq("tipo", tipo)
    .eq("alvo", alvo)
    .order("ordem", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((l) => ({
    id: l.id as string,
    pergunta: l.pergunta as string,
    resposta: l.resposta as string,
    ordem: l.ordem as number,
    origem: (l.origem as string) ?? "manual",
  }));
}

/** Substitui a FAQ do conteúdo pela lista aprovada (regrava tudo). */
export async function salvarFaqAdmin(tipo: TipoFaq, alvo: string, linhas: FaqLinha[]) {
  const itens = normalizarLinhas(linhas);

  const { error: erroLimpeza } = await supabase
    .from("faq_item")
    .delete()
    .eq("tipo", tipo)
    .eq("alvo", alvo);
  if (erroLimpeza) throw erroLimpeza;

  if (itens.length === 0) return;

  const { error } = await supabase.from("faq_item").insert(
    itens.map((i) => ({
      tipo,
      alvo,
      pergunta: i.pergunta,
      resposta: i.resposta,
      ordem: i.ordem,
      origem: i.origem ?? "manual",
    })),
  );
  if (error) throw error;
}

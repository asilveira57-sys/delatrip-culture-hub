import { supabase } from "@/integrations/supabase/client";

import type { Blocos } from "@/lib/paginas-core";

export type SeoRotaAdmin = {
  caminho: string;
  titulo: string;
  descricao: string;
  keywords: string;
  noindex: boolean;
};

export async function carregarPaginaAdmin(caminho: string) {
  const [pagina, seo] = await Promise.all([
    supabase.from("pagina").select("blocos").eq("caminho", caminho).maybeSingle(),
    supabase
      .from("seo_rota")
      .select("caminho, titulo, descricao, seo_keywords, noindex")
      .eq("caminho", caminho)
      .maybeSingle(),
  ]);
  return {
    blocos: (pagina.data?.blocos ?? {}) as Blocos,
    seo: {
      caminho,
      titulo: seo.data?.titulo ?? "",
      descricao: seo.data?.descricao ?? "",
      keywords: seo.data?.seo_keywords ?? "",
      noindex: seo.data?.noindex ?? false,
    } satisfies SeoRotaAdmin,
  };
}

export async function salvarPaginaAdmin(
  caminho: string,
  blocos: Blocos,
  seo: SeoRotaAdmin,
) {
  const { error } = await supabase.from("pagina").upsert(
    {
      caminho,
      blocos: blocos as never,
      atualizado_em: new Date().toISOString(),
    },
    { onConflict: "caminho" },
  );
  if (error) throw error;

  const { error: erroSeo } = await supabase.from("seo_rota").upsert(
    {
      caminho,
      titulo: seo.titulo || null,
      descricao: seo.descricao || null,
      seo_keywords: seo.keywords || null,
      noindex: seo.noindex,
    },
    { onConflict: "caminho" },
  );
  if (erroSeo) throw erroSeo;
}

/** Caminhos que já possuem conteúdo salvo na tabela `pagina`. */
export async function listarCaminhosEditados(): Promise<Set<string>> {
  const { data } = await supabase.from("pagina").select("caminho");
  return new Set((data ?? []).map((l) => l.caminho as string));
}

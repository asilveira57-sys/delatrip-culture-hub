import { createServerFn } from "@tanstack/react-start";

import { clientePublico } from "@/lib/public-db.server";

export type StatusProdutoSeo = {
  indexavel: boolean;
  kits: { nome: string; nivel: string | null }[];
};

/** Produto só é indexável com descrição própria aprovada (evita conteúdo duplicado da loja). */
export const statusSeoProduto = createServerFn({ method: "GET" })
  .inputValidator((e: { slug: string }) => ({ slug: String(e.slug).slice(0, 200) }))
  .handler(async ({ data }): Promise<StatusProdutoSeo> => {
    const supabase = clientePublico();
    if (!supabase) return { indexavel: false, kits: [] };
    try {
      const [ov, itens] = await Promise.all([
        supabase
          .from("produto_overlay")
          .select("status_revisao, descricao_html")
          .eq("slug", data.slug)
          .maybeSingle(),
        supabase
          .from("guia_kit_item")
          .select("guia_kit(nome, nivel, ativo)")
          .eq("produto_slug", data.slug),
      ]);
      const indexavel =
        ov.data?.status_revisao === "aprovado" && !!ov.data?.descricao_html?.trim();
      const kits = ((itens.data ?? []) as unknown as { guia_kit: { nome: string; nivel: string | null; ativo: boolean } | null }[])
        .map((i) => i.guia_kit)
        .filter((k): k is { nome: string; nivel: string | null; ativo: boolean } => !!k?.ativo)
        .map(({ nome, nivel }) => ({ nome, nivel }));
      return { indexavel, kits };
    } catch {
      return { indexavel: false, kits: [] };
    }
  });

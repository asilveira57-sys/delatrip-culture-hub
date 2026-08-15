import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export type RelacionadosManuais = {
  produtos: string[];
  posts: string[];
};

const VAZIO: RelacionadosManuais = { produtos: [], posts: [] };

/**
 * Amarração manual feita no admin. Quando existe, substitui a lista
 * automática por categoria na página do produto.
 */
export async function fetchRelacionados(slug: string): Promise<RelacionadosManuais> {
  try {
    const [produtos, posts] = await Promise.all([
      supabase
        .from("produto_relacionado")
        .select("slug_destino, ordem")
        .eq("slug_origem", slug)
        .order("ordem"),
      supabase
        .from("produto_post_relacionado")
        .select("slug_post, ordem")
        .eq("slug_produto", slug)
        .order("ordem"),
    ]);
    return {
      produtos: (produtos.data ?? []).map((r) => r.slug_destino),
      posts: (posts.data ?? []).map((r) => r.slug_post),
    };
  } catch {
    return VAZIO;
  }
}

export function useRelacionados(slug: string): RelacionadosManuais {
  const { data } = useQuery({
    queryKey: ["relacionados", slug],
    queryFn: () => fetchRelacionados(slug),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
  return data ?? VAZIO;
}

/** Posts publicados usados nos cartões da página de produto. */
export async function fetchPostsPorSlug(slugs: string[]) {
  if (slugs.length === 0) return [];
  const { data } = await supabase
    .from("post")
    .select("slug, titulo, resumo, capa_url, capa_alt, categoria, publicado_em")
    .in("slug", slugs)
    .eq("publicado", true);
  return data ?? [];
}

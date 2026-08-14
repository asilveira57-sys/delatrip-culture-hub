import { createServerFn } from "@tanstack/react-start";

import { CAMPOS_POST, mapearPost, postsFallback, type PostPublico } from "@/lib/blog-core";
import { clientePublico } from "@/lib/public-db.server";

/** Posts publicados e com data já alcançada (agendados ficam fora). */
export const listarPostsPublicos = createServerFn({ method: "GET" }).handler(
  async (): Promise<PostPublico[]> => {
    const supabase = clientePublico();
    if (!supabase) return postsFallback();
    try {
      const { data, error } = await supabase
        .from("post")
        .select(CAMPOS_POST)
        .eq("publicado", true)
        .lte("publicado_em", new Date().toISOString())
        .order("publicado_em", { ascending: false });
      if (error || !data || data.length === 0) return postsFallback();
      return data.map((linha) => mapearPost(linha as never));
    } catch {
      return postsFallback();
    }
  },
);

export const obterPostPublico = createServerFn({ method: "GET" })
  .inputValidator((entrada: { slug: string }) => entrada)
  .handler(async ({ data: entrada }): Promise<PostPublico | null> => {
    const supabase = clientePublico();
    const fallback = () => postsFallback().find((p) => p.slug === entrada.slug) ?? null;
    if (!supabase) return fallback();
    try {
      const { data, error } = await supabase
        .from("post")
        .select(CAMPOS_POST)
        .eq("slug", entrada.slug)
        .eq("publicado", true)
        .lte("publicado_em", new Date().toISOString())
        .maybeSingle();
      if (error || !data) return fallback();
      return mapearPost(data as never);
    } catch {
      return fallback();
    }
  });

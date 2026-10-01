import { createServerFn } from "@tanstack/react-start";

import type { PostPublico } from "@/lib/blog-core";
import { listarPostsPublicos } from "@/lib/blog.functions";
import { clientePublico } from "@/lib/public-db.server";

/** Posts publicados ligados ao cluster "guia-iniciantes". */
export const listarPostsDoGuia = createServerFn({ method: "GET" }).handler(
  async (): Promise<PostPublico[]> => {
    const supabase = clientePublico();
    if (!supabase) return [];
    try {
      const { data } = await supabase
        .from("post_cluster")
        .select("slug_post")
        .eq("cluster_slug", "guia-iniciantes");
      const slugs = new Set((data ?? []).map((l) => l.slug_post as string));
      if (!slugs.size) return [];
      const todos = await listarPostsPublicos();
      return todos.filter((p) => slugs.has(p.slug)).slice(0, 12);
    } catch {
      return [];
    }
  },
);

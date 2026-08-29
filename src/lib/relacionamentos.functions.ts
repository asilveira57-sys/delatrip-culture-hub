import { createServerFn } from "@tanstack/react-start";

import { clientePublico } from "@/lib/public-db.server";
import {
  CONFIG_GLOBAL_PADRAO,
  selecionarExibidos,
  type Relacao,
} from "@/lib/relacionamentos-core";

export type RelacionadosPublicos = {
  produtos: { slug: string; score: number }[];
  posts: {
    slug: string;
    titulo: string;
    resumo: string;
    categoria: string;
    data: string;
    capaUrl: string | null;
    capaAlt: string | null;
  }[];
};

const VAZIO: RelacionadosPublicos = { produtos: [], posts: [] };

/**
 * Leitura barata: os scores já foram calculados e gravados pelo admin.
 * A página pública só ordena o que veio do banco.
 */
export const carregarRelacionados = createServerFn({ method: "GET" })
  .inputValidator((entrada: { slug: string }) => entrada)
  .handler(async ({ data: entrada }): Promise<RelacionadosPublicos> => {
    const supabase = clientePublico();
    if (!supabase) return VAZIO;
    try {
      const [configGlobal, configPost, produtos, posts] = await Promise.all([
        supabase.from("config_site").select("valor").eq("chave", "relacionamentos").maybeSingle(),
        supabase
          .from("post_relacionamento_config")
          .select("*")
          .eq("slug_post", entrada.slug)
          .maybeSingle(),
        supabase
          .from("post_produto_relacao")
          .select("slug_produto, origem, score, manual, excluido, fixado, posicao")
          .eq("slug_post", entrada.slug)
          .eq("excluido", false),
        supabase
          .from("post_post_relacao")
          .select("slug_destino, origem, score, manual, excluido, fixado, posicao")
          .eq("slug_origem", entrada.slug)
          .eq("excluido", false),
      ]);

      const global = {
        ...CONFIG_GLOBAL_PADRAO,
        ...((configGlobal.data?.valor ?? {}) as Partial<typeof CONFIG_GLOBAL_PADRAO>),
      };
      const limiteProdutos =
        (configPost.data?.quantidade_produtos as number | null) ?? global.quantidadeProdutos;
      const limitePosts =
        (configPost.data?.quantidade_conteudos as number | null) ?? global.quantidadeConteudos;

      const relProdutos: Relacao[] = (produtos.data ?? []).map((r) => ({
        slug: r.slug_produto as string,
        origem: r.origem as string,
        score: Number(r.score ?? 0),
        manual: !!r.manual,
        excluido: !!r.excluido,
        fixado: !!r.fixado,
        posicao: Number(r.posicao ?? 0),
      }));
      const relPosts: Relacao[] = (posts.data ?? []).map((r) => ({
        slug: r.slug_destino as string,
        origem: r.origem as string,
        score: Number(r.score ?? 0),
        manual: !!r.manual,
        excluido: !!r.excluido,
        fixado: !!r.fixado,
        posicao: Number(r.posicao ?? 0),
      }));

      const produtosExibidos = selecionarExibidos(
        relProdutos,
        limiteProdutos,
        global.minimoScoreProduto,
      );
      const postsExibidos = selecionarExibidos(relPosts, limitePosts, global.minimoScoreConteudo);

      let detalhes: RelacionadosPublicos["posts"] = [];
      if (postsExibidos.length > 0) {
        const { data } = await supabase
          .from("post")
          .select("slug, titulo, resumo, categoria, publicado_em, capa_url, capa_alt")
          .in(
            "slug",
            postsExibidos.map((p) => p.slug),
          )
          .eq("publicado", true)
          .lte("publicado_em", new Date().toISOString());
        const porSlug = new Map((data ?? []).map((p) => [p.slug as string, p]));
        detalhes = postsExibidos
          .map((r) => porSlug.get(r.slug))
          .filter(Boolean)
          .map((p) => ({
            slug: p!.slug as string,
            titulo: p!.titulo as string,
            resumo: (p!.resumo as string) ?? "",
            categoria: (p!.categoria as string) ?? "Cultura",
            data: ((p!.publicado_em as string) ?? "").slice(0, 10),
            capaUrl: (p!.capa_url as string) ?? null,
            capaAlt: (p!.capa_alt as string) ?? null,
          }));
      }

      return {
        produtos: produtosExibidos.map((r) => ({ slug: r.slug, score: r.score })),
        posts: detalhes,
      };
    } catch {
      return VAZIO;
    }
  });

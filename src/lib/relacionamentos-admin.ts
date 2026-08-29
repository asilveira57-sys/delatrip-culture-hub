import { supabase } from "@/integrations/supabase/client";

import { products, type Product } from "@/lib/catalog";
import {
  CONFIG_GLOBAL_PADRAO,
  configPostPadrao,
  indexarPost,
  pontuarPost,
  pontuarProduto,
  sugerirLinksInternos,
  type ConfigGlobalRelacionamentos,
  type ConfigPost,
  type DocumentoPost,
  type Pontuacao,
  type Relacao,
  type SugestaoLink,
} from "@/lib/relacionamentos-core";

export type Cluster = {
  slug: string;
  nome: string;
  descricao: string | null;
};

export type LinkInterno = {
  id: string;
  slug_post: string;
  ancora: string;
  slug_destino: string;
  score: number;
  status: "sugerido" | "aceito" | "ignorado";
};

const CHAVE_CONFIG = "relacionamentos";

/* ---------------- configuração global ---------------- */

export async function carregarConfigGlobal(): Promise<ConfigGlobalRelacionamentos> {
  const { data } = await supabase
    .from("config_site")
    .select("valor")
    .eq("chave", CHAVE_CONFIG)
    .maybeSingle();
  const valor = (data?.valor ?? {}) as Partial<ConfigGlobalRelacionamentos>;
  return {
    ...CONFIG_GLOBAL_PADRAO,
    ...valor,
    pesos: { ...CONFIG_GLOBAL_PADRAO.pesos, ...(valor.pesos ?? {}) },
  };
}

export async function salvarConfigGlobal(config: ConfigGlobalRelacionamentos) {
  const { error } = await supabase
    .from("config_site")
    .upsert({ chave: CHAVE_CONFIG, valor: config as never }, { onConflict: "chave" });
  if (error) throw error;
}

/* ---------------- clusters ---------------- */

export async function listarClusters(): Promise<Cluster[]> {
  const { data } = await supabase.from("cluster_seo").select("slug, nome, descricao").order("nome");
  return (data ?? []) as Cluster[];
}

export async function salvarCluster(cluster: Cluster) {
  const { error } = await supabase.from("cluster_seo").upsert(cluster, { onConflict: "slug" });
  if (error) throw error;
}

export async function excluirCluster(slug: string) {
  const { error } = await supabase.from("cluster_seo").delete().eq("slug", slug);
  if (error) throw error;
}

export async function clustersDoPost(slugPost: string) {
  const { data } = await supabase
    .from("post_cluster")
    .select("cluster_slug, principal")
    .eq("slug_post", slugPost);
  return (data ?? []) as { cluster_slug: string; principal: boolean }[];
}

export async function salvarClustersDoPost(
  slugPost: string,
  clusters: { cluster_slug: string; principal: boolean }[],
) {
  await supabase.from("post_cluster").delete().eq("slug_post", slugPost);
  if (clusters.length === 0) return;
  const { error } = await supabase
    .from("post_cluster")
    .insert(clusters.map((c) => ({ ...c, slug_post: slugPost })));
  if (error) throw error;
}

/* ---------------- tags ---------------- */

export async function tagsDoPost(slugPost: string) {
  const { data } = await supabase.from("post_tag").select("tag").eq("slug_post", slugPost);
  return (data ?? []).map((r) => r.tag as string);
}

export async function salvarTagsDoPost(slugPost: string, tags: string[]) {
  await supabase.from("post_tag").delete().eq("slug_post", slugPost);
  const limpas = [...new Set(tags.map((t) => t.trim()).filter(Boolean))];
  if (limpas.length === 0) return;
  const { error } = await supabase
    .from("post_tag")
    .insert(limpas.map((tag) => ({ slug_post: slugPost, tag })));
  if (error) throw error;
}

export async function listarTodasTags() {
  const { data } = await supabase.from("post_tag").select("tag").limit(5000);
  return [...new Set((data ?? []).map((r) => r.tag as string))].sort();
}

/* ---------------- configuração por post ---------------- */

export async function carregarConfigPost(slugPost: string): Promise<ConfigPost> {
  const { data } = await supabase
    .from("post_relacionamento_config")
    .select("*")
    .eq("slug_post", slugPost)
    .maybeSingle();
  if (!data) return configPostPadrao(slugPost);
  return {
    ...configPostPadrao(slugPost),
    ...(data as object),
    categorias: (data.categorias ?? []) as string[],
  } as ConfigPost;
}

export async function salvarConfigPost(config: ConfigPost) {
  const { error } = await supabase
    .from("post_relacionamento_config")
    .upsert({ ...config, categorias: config.categorias as never }, { onConflict: "slug_post" });
  if (error) throw error;
}

/* ---------------- relações ---------------- */

type LinhaProduto = {
  slug_produto: string;
  origem: string;
  score: number;
  manual: boolean;
  excluido: boolean;
  fixado: boolean;
  posicao: number;
};

type LinhaPost = {
  slug_destino: string;
  origem: string;
  score: number;
  manual: boolean;
  excluido: boolean;
  fixado: boolean;
  posicao: number;
};

export async function relacoesProduto(slugPost: string): Promise<Relacao[]> {
  const { data } = await supabase
    .from("post_produto_relacao")
    .select("slug_produto, origem, score, manual, excluido, fixado, posicao")
    .eq("slug_post", slugPost);
  return ((data ?? []) as LinhaProduto[]).map((r) => ({ ...r, slug: r.slug_produto }));
}

export async function relacoesPost(slugPost: string): Promise<Relacao[]> {
  const { data } = await supabase
    .from("post_post_relacao")
    .select("slug_destino, origem, score, manual, excluido, fixado, posicao")
    .eq("slug_origem", slugPost);
  return ((data ?? []) as LinhaPost[]).map((r) => ({ ...r, slug: r.slug_destino }));
}

export async function gravarRelacaoProduto(slugPost: string, relacao: Relacao) {
  const { error } = await supabase.from("post_produto_relacao").upsert(
    {
      slug_post: slugPost,
      slug_produto: relacao.slug,
      origem: relacao.origem,
      score: relacao.score,
      manual: relacao.manual,
      excluido: relacao.excluido,
      fixado: relacao.fixado,
      posicao: relacao.posicao,
    },
    { onConflict: "slug_post,slug_produto" },
  );
  if (error) throw error;
}

export async function gravarRelacaoPost(slugPost: string, relacao: Relacao) {
  const { error } = await supabase.from("post_post_relacao").upsert(
    {
      slug_origem: slugPost,
      slug_destino: relacao.slug,
      origem: relacao.origem,
      score: relacao.score,
      manual: relacao.manual,
      excluido: relacao.excluido,
      fixado: relacao.fixado,
      posicao: relacao.posicao,
    },
    { onConflict: "slug_origem,slug_destino" },
  );
  if (error) throw error;
}

export async function removerRelacaoProduto(slugPost: string, slugProduto: string) {
  await supabase
    .from("post_produto_relacao")
    .delete()
    .eq("slug_post", slugPost)
    .eq("slug_produto", slugProduto);
}

export async function removerRelacaoPost(slugPost: string, slugDestino: string) {
  await supabase
    .from("post_post_relacao")
    .delete()
    .eq("slug_origem", slugPost)
    .eq("slug_destino", slugDestino);
}

/* ---------------- cálculo ---------------- */

export type SugestaoProduto = Pontuacao & { produto: Product };

/** Produtos elegíveis: catálogo inteiro ou apenas as categorias escolhidas. */
export function produtosElegiveis(categorias: string[]) {
  if (categorias.length === 0) return products;
  const alvo = new Set(categorias);
  return products.filter((p) => p.categoriaSlug && alvo.has(p.categoriaSlug));
}

export function pontuarProdutos(
  doc: DocumentoPost,
  config: ConfigPost,
  global: ConfigGlobalRelacionamentos,
): SugestaoProduto[] {
  const indice = indexarPost(doc);
  const elegiveis = produtosElegiveis(config.categorias);
  const exibirSemEstoque = config.exibir_sem_estoque ?? global.exibirSemEstoque;
  const saida: SugestaoProduto[] = [];
  for (const produto of elegiveis) {
    if (!exibirSemEstoque && produto.estoque <= 0) continue;
    const pontuacao = pontuarProduto(indice, produto, global.pesos);
    if (pontuacao.score <= 0) continue;
    saida.push({ ...pontuacao, produto });
  }
  return saida.sort((a, b) => b.score - a.score).slice(0, 60);
}

export function pontuarPosts(
  doc: DocumentoPost,
  candidatos: DocumentoPost[],
  global: ConfigGlobalRelacionamentos,
): (Pontuacao & { post: DocumentoPost })[] {
  const indice = indexarPost(doc);
  return candidatos
    .filter((c) => c.slug !== doc.slug)
    .map((post) => ({ ...pontuarPost(indice, post, global.pesos), post }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 40);
}

/**
 * Recalcula e grava as relações automáticas de um post preservando tudo que
 * foi decidido manualmente (selecionado, fixado, excluído ou reordenado).
 */
export async function recalcularPost(
  doc: DocumentoPost,
  candidatos: DocumentoPost[],
  opcoes?: { config?: ConfigPost; global?: ConfigGlobalRelacionamentos },
) {
  const global = opcoes?.global ?? (await carregarConfigGlobal());
  const config = opcoes?.config ?? (await carregarConfigPost(doc.slug));
  const [jaProdutos, jaPosts] = await Promise.all([
    relacoesProduto(doc.slug),
    relacoesPost(doc.slug),
  ]);
  const manuaisProduto = new Set(
    jaProdutos.filter((r) => r.manual || r.excluido || r.fixado).map((r) => r.slug),
  );
  const manuaisPost = new Set(
    jaPosts.filter((r) => r.manual || r.excluido || r.fixado).map((r) => r.slug),
  );

  const produtosCalc = pontuarProdutos(doc, config, global)
    .filter((s) => !manuaisProduto.has(s.produto.slug))
    .slice(0, Math.max(20, global.quantidadeProdutos * 3));
  const postsCalc = pontuarPosts(doc, candidatos, global)
    .filter((s) => !manuaisPost.has(s.post.slug))
    .slice(0, Math.max(15, global.quantidadeConteudos * 3));

  // Remove as automáticas antigas; as manuais permanecem intocadas.
  await supabase
    .from("post_produto_relacao")
    .delete()
    .eq("slug_post", doc.slug)
    .eq("manual", false)
    .eq("fixado", false)
    .eq("excluido", false);
  await supabase
    .from("post_post_relacao")
    .delete()
    .eq("slug_origem", doc.slug)
    .eq("manual", false)
    .eq("fixado", false)
    .eq("excluido", false);

  if (produtosCalc.length > 0) {
    await supabase.from("post_produto_relacao").upsert(
      produtosCalc.map((s, i) => ({
        slug_post: doc.slug,
        slug_produto: s.produto.slug,
        origem: s.origens.join(" + ") || "automatico",
        score: s.score,
        manual: false,
        excluido: false,
        fixado: false,
        posicao: i,
      })),
      { onConflict: "slug_post,slug_produto" },
    );
  }
  if (postsCalc.length > 0) {
    await supabase.from("post_post_relacao").upsert(
      postsCalc.map((s, i) => ({
        slug_origem: doc.slug,
        slug_destino: s.post.slug,
        origem: s.origens.join(" + ") || "automatico",
        score: s.score,
        manual: false,
        excluido: false,
        fixado: false,
        posicao: i,
      })),
      { onConflict: "slug_origem,slug_destino" },
    );
  }

  await salvarConfigPost({ ...config, recalculado_em: new Date().toISOString() });
  return { produtos: produtosCalc.length, posts: postsCalc.length };
}

/* ---------------- links internos ---------------- */

export async function listarLinksInternos(slugPost: string): Promise<LinkInterno[]> {
  const { data } = await supabase
    .from("post_link_interno")
    .select("id, slug_post, ancora, slug_destino, score, status")
    .eq("slug_post", slugPost)
    .order("score", { ascending: false });
  return (data ?? []) as LinkInterno[];
}

export async function gerarLinksInternos(
  doc: DocumentoPost,
  candidatos: DocumentoPost[],
  maximo: number,
): Promise<SugestaoLink[]> {
  const sugestoes = sugerirLinksInternos(doc, candidatos, { maximo });
  const existentes = await listarLinksInternos(doc.slug);
  const ignorados = new Set(
    existentes.filter((l) => l.status !== "sugerido").map((l) => `${l.ancora}|${l.slug_destino}`),
  );
  const novas = sugestoes.filter((s) => !ignorados.has(`${s.ancora}|${s.slug_destino}`));
  if (novas.length > 0) {
    await supabase.from("post_link_interno").upsert(
      novas.map((s) => ({
        slug_post: doc.slug,
        ancora: s.ancora,
        slug_destino: s.slug_destino,
        score: s.score,
        status: "sugerido",
      })),
      { onConflict: "slug_post,ancora,slug_destino" },
    );
  }
  return sugestoes;
}

export async function atualizarStatusLink(id: string, status: LinkInterno["status"]) {
  const { error } = await supabase.from("post_link_interno").update({ status }).eq("id", id);
  if (error) throw error;
}

/** Aplica o link aceito na primeira ocorrência da âncora dentro do HTML. */
export function aplicarLinkNoHtml(html: string, ancora: string, slugDestino: string) {
  const partes = ancora.split(" ").map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const padrao = partes
    .map((p) => `[${p[0]}${p[0]?.toUpperCase() ?? ""}]${p.slice(1)}[a-zà-ú]*`)
    .join("\\s+");
  const regex = new RegExp(`(?![^<]*>)(${padrao})`, "i");
  if (!regex.test(html)) return null;
  return html.replace(regex, `<a href="/blog/${slugDestino}">$1</a>`);
}

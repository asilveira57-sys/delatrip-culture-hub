import { supabase } from "@/integrations/supabase/client";

import { products, type Product } from "@/lib/catalog";
import { similaridade } from "@/lib/enriquecer-core";

/** Linha completa da sobreposição, como o admin edita. */
export type OverlayAdmin = {
  slug: string;
  descricao_html: string | null;
  descricao_original: string | null;
  seo_titulo: string | null;
  seo_descricao: string | null;
  oculto: boolean;
  destaque: boolean | null;
  enriquecido_em: string | null;
  enriquecido_modelo: string | null;
  status_revisao: string | null;
  observacao: string | null;
};

export const CAMPOS_OVERLAY =
  "slug, descricao_html, descricao_original, seo_titulo, seo_descricao, oculto, destaque, enriquecido_em, enriquecido_modelo, status_revisao, observacao";

export type StatusEnriquecimento =
  | "original"
  | "pendente"
  | "aprovado"
  | "reprovado";

export function statusOverlay(ov?: OverlayAdmin | null): StatusEnriquecimento {
  if (!ov || !ov.descricao_html) return "original";
  if (ov.status_revisao === "aprovado") return "aprovado";
  if (ov.status_revisao === "reprovado") return "reprovado";
  return "pendente";
}

export async function listarOverlaysAdmin(): Promise<Map<string, OverlayAdmin>> {
  const { data, error } = await supabase
    .from("produto_overlay")
    .select(CAMPOS_OVERLAY)
    .limit(5000);
  if (error) throw error;
  return new Map((data as OverlayAdmin[]).map((o) => [o.slug, o]));
}

export async function obterOverlayAdmin(slug: string): Promise<OverlayAdmin | null> {
  const { data, error } = await supabase
    .from("produto_overlay")
    .select(CAMPOS_OVERLAY)
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return (data as OverlayAdmin) ?? null;
}

export async function salvarOverlay(
  slug: string,
  patch: Partial<Omit<OverlayAdmin, "slug">>,
) {
  const { error } = await supabase
    .from("produto_overlay")
    .upsert({ slug, ...patch }, { onConflict: "slug" });
  if (error) throw error;
}

/** Reverter = descartar a edição e voltar ao texto original da Tray. */
export async function reverterOverlay(slug: string) {
  await salvarOverlay(slug, {
    descricao_html: null,
    seo_titulo: null,
    seo_descricao: null,
    enriquecido_em: null,
    enriquecido_modelo: null,
    status_revisao: null,
    observacao: null,
  });
}

/** Ocultar = o produto some do site, mas a edição continua guardada. */
export async function definirOcultoEmLote(slugs: string[], oculto: boolean) {
  if (slugs.length === 0) return;
  const { error } = await supabase
    .from("produto_overlay")
    .upsert(
      slugs.map((slug) => ({ slug, oculto })),
      { onConflict: "slug" },
    );
  if (error) throw error;
}

export async function definirRevisaoEmLote(slugs: string[], status: string) {
  if (slugs.length === 0) return;
  const { error } = await supabase
    .from("produto_overlay")
    .upsert(
      slugs.map((slug) => ({ slug, status_revisao: status })),
      { onConflict: "slug" },
    );
  if (error) throw error;
}

/* ---------------- variantes ---------------- */

/** Remove sufixos de embalagem para comparar nomes de variações. */
export function nomeBase(nome: string) {
  return nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(
      /\b(display|caixa|cx|pacote|pct|unid(?:ade)?s?|un|c\/\s*\d+|com\s+\d+|\d+\s*x\s*\d+|\d+\s*(un|pcs|folhas|g|ml|mm|cm))\b/g,
      " ",
    )
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * Variantes prováveis: mesma marca e nome muito parecido depois de remover
 * os termos de embalagem. Serve para propagar a mesma descrição.
 */
export function variantesDe(produto: Product, minimo = 0.72): Product[] {
  const base = nomeBase(produto.nome);
  const achados: { p: Product; s: number }[] = [];
  for (const p of products) {
    if (p.slug === produto.slug) continue;
    if (produto.marcaSlug && p.marcaSlug !== produto.marcaSlug) continue;
    const s = similaridade(base, nomeBase(p.nome));
    if (s >= minimo) achados.push({ p, s });
  }
  return achados.sort((a, b) => b.s - a.s).map((a) => a.p);
}

/** Copia a descrição (e o SEO) do produto para os slugs indicados. */
export async function copiarParaVariantes(
  origem: OverlayAdmin,
  slugs: string[],
) {
  if (slugs.length === 0) return 0;
  const { error } = await supabase.from("produto_overlay").upsert(
    slugs.map((slug) => ({
      slug,
      descricao_html: origem.descricao_html,
      seo_titulo: null,
      seo_descricao: origem.seo_descricao,
      status_revisao: origem.status_revisao,
      enriquecido_em: origem.enriquecido_em,
      enriquecido_modelo: origem.enriquecido_modelo,
      observacao: "Copiado de " + origem.slug,
    })),
    { onConflict: "slug" },
  );
  if (error) throw error;
  return slugs.length;
}

/* ---------------- relacionados ---------------- */

export const MAX_PRODUTOS_RELACIONADOS = 8;
export const MAX_POSTS_RELACIONADOS = 3;

export async function carregarRelacionadosAdmin(slug: string) {
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
}

export async function salvarRelacionadosAdmin(
  slug: string,
  produtosSlugs: string[],
  postsSlugs: string[],
) {
  const prods = produtosSlugs.slice(0, MAX_PRODUTOS_RELACIONADOS);
  const pubs = postsSlugs.slice(0, MAX_POSTS_RELACIONADOS);

  await supabase.from("produto_relacionado").delete().eq("slug_origem", slug);
  if (prods.length) {
    const { error } = await supabase.from("produto_relacionado").insert(
      prods.map((destino, ordem) => ({
        slug_origem: slug,
        slug_destino: destino,
        ordem,
      })),
    );
    if (error) throw error;
  }

  await supabase.from("produto_post_relacionado").delete().eq("slug_produto", slug);
  if (pubs.length) {
    const { error } = await supabase.from("produto_post_relacionado").insert(
      pubs.map((post, ordem) => ({ slug_produto: slug, slug_post: post, ordem })),
    );
    if (error) throw error;
  }
}

/* ---------------- estatísticas ---------------- */

export type EstatisticasEnriquecimento = {
  gerados: number;
  aprovados: number;
  reprovados: number;
  custoTotal: number;
  custoMes: number;
};

export async function estatisticasEnriquecimento(): Promise<EstatisticasEnriquecimento> {
  const { data } = await supabase
    .from("enriquecimento_log")
    .select("custo_usd, aprovado, created_at")
    .order("created_at", { ascending: false })
    .limit(5000);

  const linhas = data ?? [];
  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);

  let custoTotal = 0;
  let custoMes = 0;
  let aprovados = 0;
  for (const l of linhas) {
    const custo = Number(l.custo_usd ?? 0);
    custoTotal += custo;
    if (new Date(l.created_at) >= inicioMes) custoMes += custo;
    if (l.aprovado) aprovados++;
  }
  return {
    gerados: linhas.length,
    aprovados,
    reprovados: linhas.length - aprovados,
    custoTotal,
    custoMes,
  };
}

export function formatarUsd(valor: number) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

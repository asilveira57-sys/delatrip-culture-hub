import { supabase } from "@/integrations/supabase/client";

import { markdownSimplesParaHtml } from "@/lib/blog-core";
import { posts as postsJson } from "@/lib/editorial";
import { sanitizarHtml } from "@/lib/sanitize";

export type PostAdmin = {
  slug: string;
  titulo: string;
  resumo: string | null;
  conteudo_html: string | null;
  capa_url: string | null;
  capa_alt: string | null;
  categoria: string | null;
  autor: string | null;
  publicado: boolean;
  publicado_em: string | null;
  seo_titulo: string | null;
  seo_descricao: string | null;
  seo_keywords?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type StatusPost = "rascunho" | "publicado" | "agendado";

export function statusDoPost(post: {
  publicado: boolean;
  publicado_em: string | null;
}): StatusPost {
  if (!post.publicado) return "rascunho";
  if (post.publicado_em && new Date(post.publicado_em) > new Date()) return "agendado";
  return "publicado";
}

export function gerarSlug(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

/** Converte um post do JSON legado no formato do admin. */
export function postJsonParaAdmin(p: (typeof postsJson)[number]): PostAdmin {
  return {
    slug: p.slug,
    titulo: p.titulo,
    resumo: p.resumo ?? null,
    conteudo_html: markdownSimplesParaHtml(p.conteudo),
    capa_url: `asset:${p.imagem}`,
    capa_alt: p.titulo,
    categoria: p.categoria ?? null,
    autor: "DeLaTrip",
    publicado: true,
    publicado_em: `${p.data}T12:00:00.000Z`,
    seo_titulo: null,
    seo_descricao: null,
    seo_keywords: null,
  };
}

export async function listarPostsAdmin(): Promise<PostAdmin[]> {
  const { data, error } = await supabase
    .from("post")
    .select("*")
    .order("publicado_em", { ascending: false, nullsFirst: false });
  if (error) throw error;
  const doBanco = (data ?? []) as PostAdmin[];
  const slugs = new Set(doBanco.map((p) => p.slug));
  const legados = postsJson.filter((p) => !slugs.has(p.slug)).map(postJsonParaAdmin);
  return [...doBanco, ...legados].sort((a, b) =>
    (b.publicado_em ?? "").localeCompare(a.publicado_em ?? ""),
  );
}


export async function contarCurtidasPorPost(): Promise<Record<string, number>> {
  const { data } = await supabase
    .from("curtida_contagem")
    .select("alvo, total")
    .eq("tipo", "post");
  const mapa: Record<string, number> = {};
  for (const linha of data ?? []) {
    if (linha.alvo) mapa[linha.alvo] = Number(linha.total ?? 0);
  }
  return mapa;
}

export async function obterPostAdmin(slug: string): Promise<PostAdmin | null> {
  const { data, error } = await supabase.from("post").select("*").eq("slug", slug).maybeSingle();
  if (error) throw error;
  if (data) return data as PostAdmin;
  const legado = postsJson.find((p) => p.slug === slug);
  return legado ? postJsonParaAdmin(legado) : null;
}


/** Grava o post; quando o slug mudou, renomeia o registro existente. */
export async function salvarPost(post: PostAdmin, slugOriginal?: string) {
  const registro = { ...post, conteudo_html: sanitizarHtml(post.conteudo_html) };
  if (slugOriginal && slugOriginal !== post.slug) {
    const { error } = await supabase.from("post").update(registro).eq("slug", slugOriginal);
    if (error) throw error;
    return;
  }
  const { error } = await supabase.from("post").upsert(registro, { onConflict: "slug" });
  if (error) throw error;
}

export async function excluirPost(slug: string) {
  const { error } = await supabase.from("post").delete().eq("slug", slug);
  if (error) throw error;
}

export async function duplicarPost(post: PostAdmin) {
  const copia: PostAdmin = {
    ...post,
    slug: `${post.slug}-copia-${Math.random().toString(36).slice(2, 6)}`,
    titulo: `${post.titulo} (cópia)`,
    publicado: false,
    publicado_em: null,
  };
  delete copia.created_at;
  delete copia.updated_at;
  const { error } = await supabase.from("post").insert(copia);
  if (error) throw error;
  return copia.slug;
}

/** Rotina única: importa os posts de src/data/posts.json para a tabela post. */
export async function importarPostsDoJson() {
  const registros = postsJson.map((p) => ({
    slug: p.slug,
    titulo: p.titulo,
    resumo: p.resumo,
    conteudo_html: markdownSimplesParaHtml(p.conteudo),
    capa_url: `asset:${p.imagem}`,
    capa_alt: p.titulo,
    categoria: p.categoria,
    autor: "DeLaTrip",
    publicado: true,
    publicado_em: `${p.data}T12:00:00.000Z`,
  }));
  const { error } = await supabase.from("post").upsert(registros, { onConflict: "slug" });
  if (error) throw error;
  return registros.length;
}

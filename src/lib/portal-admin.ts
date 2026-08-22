import { supabase } from "@/integrations/supabase/client";

import type { EpisodioPodcast, PortalConfig } from "@/lib/portal-core";
import { mesclarConfig } from "@/lib/portal-core";
import { PORTAL_CONFIG_PADRAO } from "@/lib/portal-defaults";

export const DOCUMENTOS_LEGAIS = [
  { chave: "privacidade", nome: "Política de Privacidade", caminho: "/politica-de-privacidade" },
  { chave: "cookies", nome: "Política de Cookies", caminho: "/politica-de-cookies" },
  { chave: "termos", nome: "Termos de Uso", caminho: "/termos-de-uso" },
  { chave: "lgpd", nome: "LGPD", caminho: "/lgpd" },
  { chave: "maioridade", nome: "Aviso 18+", caminho: "/maiores-de-18" },
] as const;

export type MensagemContato = {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  categoria: string;
  assunto: string;
  mensagem: string;
  status: string;
  origem: string | null;
  created_at: string;
};

export type SolicitacaoLgpd = {
  id: string;
  nome: string;
  email: string;
  tipo: string;
  descricao: string;
  status: string;
  created_at: string;
};

export async function listarMensagens(): Promise<MensagemContato[]> {
  const { data, error } = await supabase
    .from("contato_mensagem")
    .select("id, nome, email, telefone, categoria, assunto, mensagem, status, origem, created_at")
    .order("created_at", { ascending: false })
    .limit(300);
  if (error) throw error;
  return (data ?? []) as MensagemContato[];
}

export async function listarSolicitacoesLgpd(): Promise<SolicitacaoLgpd[]> {
  const { data, error } = await supabase
    .from("lgpd_solicitacao")
    .select("id, nome, email, tipo, descricao, status, created_at")
    .order("created_at", { ascending: false })
    .limit(300);
  if (error) throw error;
  return (data ?? []) as SolicitacaoLgpd[];
}

export async function atualizarStatus(
  tabela: "contato_mensagem" | "lgpd_solicitacao",
  id: string,
  status: string,
) {
  const { error } = await supabase.from(tabela).update({ status }).eq("id", id);
  if (error) throw error;
}

export async function carregarConfigAdmin(): Promise<PortalConfig> {
  const { data } = await supabase
    .from("config_site")
    .select("chave, valor")
    .in("chave", ["empresa", "redes", "seo_padrao", "lgpd_config"]);
  const valores = Object.fromEntries(
    (data ?? []).map((r) => [r.chave as string, r.valor as unknown]),
  );
  return mesclarConfig(PORTAL_CONFIG_PADRAO, valores);
}

export async function salvarConfigAdmin(config: PortalConfig) {
  const linhas = [
    { chave: "empresa", valor: config.empresa },
    { chave: "redes", valor: config.redes },
    { chave: "seo_padrao", valor: config.seoPadrao },
    { chave: "lgpd_config", valor: config.lgpd },
  ];
  const { error } = await supabase
    .from("config_site")
    .upsert(linhas as never, { onConflict: "chave" });
  if (error) throw error;
}

export type DocumentoAdmin = {
  chave: string;
  titulo: string;
  conteudo_html: string;
  versao: string;
  status: string;
  publicado_em: string | null;
  updated_at: string | null;
};

export async function listarDocumentosAdmin(): Promise<DocumentoAdmin[]> {
  const { data, error } = await supabase
    .from("documento_legal")
    .select("chave, titulo, conteudo_html, versao, status, publicado_em, updated_at");
  if (error) throw error;
  return (data ?? []) as DocumentoAdmin[];
}

export async function salvarDocumentoAdmin(doc: DocumentoAdmin) {
  const publicando = doc.status === "publicado";
  const { error } = await supabase.from("documento_legal").upsert(
    {
      chave: doc.chave,
      titulo: doc.titulo,
      conteudo_html: doc.conteudo_html,
      versao: doc.versao,
      status: doc.status,
      publicado_em: publicando ? new Date().toISOString() : doc.publicado_em,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "chave" },
  );
  if (error) throw error;

  // Histórico de versões: guarda o texto exatamente como foi salvo.
  await supabase.from("documento_legal_versao").insert({
    chave: doc.chave,
    titulo: doc.titulo,
    conteudo_html: doc.conteudo_html,
    versao: doc.versao,
  });
}

export async function listarVersoesDocumento(chave: string) {
  const { data } = await supabase
    .from("documento_legal_versao")
    .select("id, versao, titulo, created_at")
    .eq("chave", chave)
    .order("created_at", { ascending: false })
    .limit(20);
  return data ?? [];
}

export async function listarEpisodiosAdmin(): Promise<EpisodioPodcast[]> {
  const { data, error } = await supabase
    .from("podcast_episodio")
    .select("*")
    .order("data_publicacao", { ascending: false });
  if (error) throw error;
  return (data ?? []) as EpisodioPodcast[];
}

export async function carregarEpisodioAdmin(slug: string): Promise<EpisodioPodcast | null> {
  const { data } = await supabase
    .from("podcast_episodio")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  return (data as EpisodioPodcast | null) ?? null;
}

export async function salvarEpisodioAdmin(ep: EpisodioPodcast) {
  const { error } = await supabase
    .from("podcast_episodio")
    .upsert({ ...ep, updated_at: new Date().toISOString() } as never, { onConflict: "slug" });
  if (error) throw error;
}

export async function excluirEpisodioAdmin(slug: string) {
  const { error } = await supabase.from("podcast_episodio").delete().eq("slug", slug);
  if (error) throw error;
}

export function gerarSlug(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

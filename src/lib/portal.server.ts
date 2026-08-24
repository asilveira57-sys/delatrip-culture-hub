import { clientePublico } from "@/lib/public-db.server";
import {
  contatoSchema,
  lgpdSchema,
  mesclarConfig,
  type DocumentoLegal,
  type PortalConfig,
} from "@/lib/portal-core";
import { PORTAL_CONFIG_PADRAO } from "@/lib/portal-defaults";

/** Hash simples e não reversível do IP, só para limitar envios repetidos. */
export async function hashIp(ip: string | null): Promise<string | null> {
  if (!ip) return null;
  const dados = new TextEncoder().encode(`delatrip:${ip}`);
  const buffer = await crypto.subtle.digest("SHA-256", dados);
  return Array.from(new Uint8Array(buffer))
    .slice(0, 16)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function ipDaRequisicao(headers: Headers): string | null {
  return (
    headers.get("cf-connecting-ip") ??
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    null
  );
}

export async function lerConfigPortal(): Promise<PortalConfig> {
  const supabase = clientePublico();
  if (!supabase) return PORTAL_CONFIG_PADRAO;
  try {
    const { data } = await supabase
      .from("config_site")
      .select("chave, valor")
      .in("chave", ["empresa", "redes", "seo_padrao", "lgpd_config"]);
    const valores = Object.fromEntries(
      (data ?? []).map((r) => [r.chave as string, r.valor as unknown]),
    );
    return mesclarConfig(PORTAL_CONFIG_PADRAO, valores);
  } catch {
    return PORTAL_CONFIG_PADRAO;
  }
}

export async function lerDocumento(chave: string): Promise<DocumentoLegal | null> {
  const supabase = clientePublico();
  if (!supabase) return null;
  try {
    const { data } = await supabase
      .from("documento_legal")
      .select("chave, titulo, conteudo_html, versao, status, publicado_em, updated_at")
      .eq("chave", chave)
      .eq("status", "publicado")
      .maybeSingle();
    return (data as DocumentoLegal | null) ?? null;
  } catch {
    return null;
  }
}

export async function gravarContato(entrada: unknown, ipHash: string | null) {
  const dados = contatoSchema.parse(entrada);
  if (dados.armadilha) throw new Error("Envio bloqueado.");
  const supabase = clientePublico();
  if (!supabase) throw new Error("Serviço indisponível no momento.");
  const { data, error } = await supabase.rpc("registrar_contato", {
    p_nome: dados.nome,
    p_email: dados.email,
    p_telefone: dados.telefone ?? "",
    p_categoria: dados.categoria,
    p_assunto: dados.assunto,
    p_mensagem: dados.mensagem,
    p_origem: dados.origem ?? "",
    p_utm: dados.utm ?? {},
    p_ip_hash: ipHash,
  });
  if (error) {
    console.error("falha ao registrar contato", error.code ?? "sem codigo");
    throw new Error(
      error.message.includes("limite")
        ? "Muitos envios em pouco tempo. Tente novamente mais tarde."
        : "Não foi possível enviar sua mensagem.",
    );
  }
  return { ok: true as const, protocolo: protocoloDe(data) };
}

/** Protocolo curto e legível derivado do id gerado no banco. */
function protocoloDe(id: unknown): string {
  return String(id ?? "")
    .replace(/-/g, "")
    .slice(0, 8)
    .toUpperCase();
}

export async function gravarLgpd(entrada: unknown, ipHash: string | null) {
  const dados = lgpdSchema.parse(entrada);
  if (dados.armadilha) throw new Error("Envio bloqueado.");
  const supabase = clientePublico();
  if (!supabase) throw new Error("Serviço indisponível no momento.");
  const { data, error } = await supabase.rpc("registrar_lgpd", {
    p_nome: dados.nome,
    p_email: dados.email,
    p_tipo: dados.tipo,
    p_descricao: dados.descricao,
    p_ip_hash: ipHash,
  });
  if (error) {
    console.error("falha ao registrar solicitacao lgpd", error.code ?? "sem codigo");
    throw new Error(
      error.message.includes("limite")
        ? "Muitos envios em pouco tempo. Tente novamente mais tarde."
        : "Não foi possível registrar sua solicitação.",
    );
  }
  return { ok: true as const, protocolo: protocoloDe(data) };
}

export async function gravarConsentimento(
  anonId: string,
  versao: string,
  categorias: Record<string, boolean>,
) {
  const supabase = clientePublico();
  if (!supabase) return { ok: false as const };
  try {
    await supabase.rpc("registrar_consentimento", {
      p_anon_id: anonId,
      p_versao: versao,
      p_categorias: categorias,
    });
  } catch {
    /* registro de consentimento não deve quebrar a navegação */
  }
  return { ok: true as const };
}

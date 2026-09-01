import { supabase } from "@/integrations/supabase/client";
import { getAnonId } from "@/lib/anon-id";

/**
 * Eventos de navegação interna. Vão para a camada de dados (quando o
 * consentimento liberou as tags) e para o banco, que alimenta o painel do admin.
 */
export type EventoRelacionado =
  | "related_product_view"
  | "related_product_click"
  | "related_post_view"
  | "related_post_click"
  | "internal_link_click";

type Payload = {
  post_id?: string;
  product_id?: string;
  related_post_id?: string;
  position?: number;
  relation_type?: string;
};

const MAPA: Record<
  EventoRelacionado,
  { evento: "view" | "click"; bloco: "produto" | "post" | "link_interno" }
> = {
  related_product_view: { evento: "view", bloco: "produto" },
  related_product_click: { evento: "click", bloco: "produto" },
  related_post_view: { evento: "view", bloco: "post" },
  related_post_click: { evento: "click", bloco: "post" },
  internal_link_click: { evento: "click", bloco: "link_interno" },
};

/** Evita duplicar a mesma visualização em recargas do componente na sessão. */
const jaEnviados = new Set<string>();

export function registrarEvento(evento: EventoRelacionado, payload: Payload) {
  if (typeof window === "undefined") return;

  const camada = (window as unknown as { dataLayer?: unknown[] }).dataLayer;
  if (Array.isArray(camada)) camada.push({ event: evento, ...payload });

  const mapeado = MAPA[evento];
  const origem = payload.post_id;
  const alvo = payload.product_id ?? payload.related_post_id;
  if (!mapeado || !origem || !alvo) return;

  const chave = `${evento}|${origem}|${alvo}`;
  if (mapeado.evento === "view") {
    if (jaEnviados.has(chave)) return;
    jaEnviados.add(chave);
  }

  void supabase.rpc("registrar_evento_relacionado", {
    p_evento: mapeado.evento,
    p_bloco: mapeado.bloco,
    p_slug_origem: origem,
    p_slug_alvo: alvo,
    p_posicao: payload.position ?? 0,
    p_anon_id: getAnonId() ?? "",
  });
}

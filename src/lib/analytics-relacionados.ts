/**
 * Eventos de navegação interna. Só empurra para a camada de dados quando ela
 * existe (o carregamento de tags depende do consentimento LGPD).
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

export function registrarEvento(evento: EventoRelacionado, payload: Payload) {
  if (typeof window === "undefined") return;
  const camada = (window as unknown as { dataLayer?: unknown[] }).dataLayer;
  if (!Array.isArray(camada)) return;
  camada.push({ event: evento, ...payload });
}

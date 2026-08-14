import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

export type TrackingId = { id: string; ativo: boolean };

export type SeoRota = {
  caminho: string;
  titulo: string | null;
  descricao: string | null;
  og_imagem: string | null;
  noindex: boolean;
};

export type SeoPublico = {
  modoConstrucao: boolean;
  ga4: TrackingId;
  metaPixel: TrackingId;
  gtm: TrackingId;
  rotas: SeoRota[];
};

export const SEO_PUBLICO_PADRAO: SeoPublico = {
  modoConstrucao: true,
  ga4: { id: "", ativo: false },
  metaPixel: { id: "", ativo: false },
  gtm: { id: "", ativo: false },
  rotas: [],
};

function tracking(valor: unknown): TrackingId {
  if (valor && typeof valor === "object") {
    const v = valor as Record<string, unknown>;
    return { id: String(v["id"] ?? ""), ativo: v["ativo"] === true };
  }
  return { id: "", ativo: false };
}

/** Configuração pública (sem segredos) usada no SSR do site. */
export const carregarSeoPublico = createServerFn({ method: "GET" }).handler(
  async (): Promise<SeoPublico> => {
    const url = process.env["SUPABASE_URL"];
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
    if (!url || !key) return SEO_PUBLICO_PADRAO;

    try {
      const supabase = createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
        global: {
          fetch: (input, init) => {
            const h = new Headers(init?.headers);
            if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
              h.delete("Authorization");
            }
            h.set("apikey", key);
            return fetch(input, { ...init, headers: h });
          },
        },
      });

      const [config, rotas] = await Promise.all([
        supabase.from("config_site").select("chave, valor"),
        supabase.from("seo_rota").select("caminho, titulo, descricao, og_imagem, noindex"),
      ]);

      const mapa = new Map(
        (config.data ?? []).map((r) => [r.chave as string, r.valor as unknown]),
      );

      return {
        modoConstrucao: mapa.get("modo_construcao") !== false,
        ga4: tracking(mapa.get("ga4_id")),
        metaPixel: tracking(mapa.get("meta_pixel_id")),
        gtm: tracking(mapa.get("gtm_id")),
        rotas: (rotas.data ?? []) as SeoRota[],
      };
    } catch {
      return SEO_PUBLICO_PADRAO;
    }
  },
);

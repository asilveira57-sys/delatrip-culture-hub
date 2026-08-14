import { createClient } from "@supabase/supabase-js";

/** Cliente publicável de servidor: apenas leituras públicas (políticas anon). */
export function clientePublico() {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input: RequestInfo | URL, init?: RequestInit) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export type ConfigServidor = {
  modoConstrucao: boolean;
  rotasNoindex: Set<string>;
  produtosOcultos: Set<string>;
};

const PADRAO: ConfigServidor = {
  modoConstrucao: true,
  rotasNoindex: new Set(),
  produtosOcultos: new Set(),
};

/** Uma leitura só, tolerante a falhas: sem banco, o site segue com o JSON. */
export async function lerConfigServidor(): Promise<ConfigServidor> {
  const supabase = clientePublico();
  if (!supabase) return PADRAO;
  try {
    const [config, rotas, overlays] = await Promise.all([
      supabase.from("config_site").select("chave, valor").eq("chave", "modo_construcao"),
      supabase.from("seo_rota").select("caminho, noindex").eq("noindex", true),
      supabase.from("produto_overlay").select("slug").eq("oculto", true).limit(5000),
    ]);
    return {
      modoConstrucao: (config.data?.[0]?.valor as unknown) !== false,
      rotasNoindex: new Set((rotas.data ?? []).map((r) => r.caminho as string)),
      produtosOcultos: new Set((overlays.data ?? []).map((o) => o.slug as string)),
    };
  } catch {
    return PADRAO;
  }
}

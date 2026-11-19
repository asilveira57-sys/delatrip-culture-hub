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
  /** Produtos com descrição própria aprovada (os únicos indexáveis). */
  produtosIndexaveis: Set<string>;
};

const PADRAO: ConfigServidor = {
  modoConstrucao: true,
  rotasNoindex: new Set(),
  produtosOcultos: new Set(),
  produtosIndexaveis: new Set(),
};

/**
 * Slugs dos posts publicados no banco (não agendados). Tolerante a falhas:
 * sem banco ou erro, devolve conjunto vazio e o sitemap usa só o JSON.
 */
export async function slugsPostsPublicados(): Promise<Set<string>> {
  const supabase = clientePublico();
  if (!supabase) return new Set();
  try {
    const { data, error } = await supabase
      .from("post")
      .select("slug")
      .eq("publicado", true)
      .lte("publicado_em", new Date().toISOString())
      .limit(5000);
    if (error || !data) return new Set();
    return new Set(data.map((p) => p.slug as string));
  } catch {
    return new Set();
  }
}

/** Posts publicados com a data da última edição (para o <lastmod> do sitemap). */
export async function postsPublicadosComData(): Promise<Map<string, string>> {
  const supabase = clientePublico();
  if (!supabase) return new Map();
  try {
    const { data, error } = await supabase
      .from("post")
      .select("slug, updated_at, publicado_em")
      .eq("publicado", true)
      .lte("publicado_em", new Date().toISOString())
      .limit(5000);
    if (error || !data) return new Map();
    return new Map(
      data.map((p) => [
        p.slug as string,
        String(p.updated_at ?? p.publicado_em ?? "").slice(0, 10),
      ]),
    );
  } catch {
    return new Map();
  }
}

/** Títulos e resumos dos posts publicados (para o /llms.txt). */
export async function postsPublicadosResumo(): Promise<{ slug: string; titulo: string; resumo: string }[]> {
  const supabase = clientePublico();
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from("post")
      .select("slug, titulo, resumo, publicado_em")
      .eq("publicado", true)
      .lte("publicado_em", new Date().toISOString())
      .order("publicado_em", { ascending: false })
      .limit(500);
    if (error || !data) return [];
    return data.map((p) => ({
      slug: p.slug as string,
      titulo: String(p.titulo ?? p.slug),
      resumo: String(p.resumo ?? ""),
    }));
  } catch {
    return [];
  }
}

/** Uma leitura só, tolerante a falhas: sem banco, o site segue com o JSON. */
export async function lerConfigServidor(): Promise<ConfigServidor> {
  const supabase = clientePublico();
  if (!supabase) return PADRAO;
  try {
    const [config, rotas, overlays, aprovados] = await Promise.all([
      supabase.from("config_site").select("chave, valor").eq("chave", "modo_construcao"),
      supabase.from("seo_rota").select("caminho, noindex").eq("noindex", true),
      supabase.from("produto_overlay").select("slug").eq("oculto", true).limit(5000),
      supabase
        .from("produto_overlay")
        .select("slug, descricao_html")
        .eq("status_revisao", "aprovado")
        .eq("oculto", false)
        .not("descricao_html", "is", null)
        .limit(5000),
    ]);
    return {
      modoConstrucao: (config.data?.[0]?.valor as unknown) !== false,
      rotasNoindex: new Set((rotas.data ?? []).map((r) => r.caminho as string)),
      produtosOcultos: new Set((overlays.data ?? []).map((o) => o.slug as string)),
      produtosIndexaveis: new Set(
        (aprovados.data ?? [])
          .filter((o) => String(o.descricao_html ?? "").trim())
          .map((o) => o.slug as string),
      ),
    };
  } catch {
    return PADRAO;
  }
}

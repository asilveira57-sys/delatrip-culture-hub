import { supabase } from "@/integrations/supabase/client";

export type Periodo = "7" | "30" | "90" | "todos";
export type Bloco = "todos" | "produto" | "post" | "link_interno";

export type Filtros = {
  periodo: Periodo;
  bloco: Bloco;
  busca: string;
};

export type LinhaMetrica = {
  slugOrigem: string;
  slugAlvo: string;
  bloco: string;
  views: number;
  cliques: number;
  ctr: number;
};

export type ResumoMetricas = {
  totalViews: number;
  totalCliques: number;
  ctr: number;
  porPost: LinhaMetrica[];
  porAlvo: LinhaMetrica[];
  pares: LinhaMetrica[];
};

type Linha = {
  evento: string;
  bloco: string;
  slug_origem: string;
  slug_alvo: string;
};

function desde(periodo: Periodo): string | null {
  if (periodo === "todos") return null;
  const dias = Number(periodo);
  return new Date(Date.now() - dias * 24 * 60 * 60 * 1000).toISOString();
}

function agrupar(linhas: Linha[], chave: (l: Linha) => [string, string, string]) {
  const mapa = new Map<string, LinhaMetrica>();
  for (const linha of linhas) {
    const [origem, alvo, bloco] = chave(linha);
    const id = `${bloco}|${origem}|${alvo}`;
    const atual =
      mapa.get(id) ?? { slugOrigem: origem, slugAlvo: alvo, bloco, views: 0, cliques: 0, ctr: 0 };
    if (linha.evento === "click") atual.cliques += 1;
    else atual.views += 1;
    mapa.set(id, atual);
  }
  return [...mapa.values()]
    .map((l) => ({ ...l, ctr: l.views > 0 ? (l.cliques / l.views) * 100 : 0 }))
    .sort((a, b) => b.views - a.views || b.cliques - a.cliques);
}

/** Lê os eventos brutos e agrega em memória (volume compatível com o painel). */
export async function carregarMetricas(filtros: Filtros): Promise<ResumoMetricas> {
  let consulta = supabase
    .from("relacionado_evento")
    .select("evento, bloco, slug_origem, slug_alvo")
    .order("created_at", { ascending: false })
    .limit(20000);

  const inicio = desde(filtros.periodo);
  if (inicio) consulta = consulta.gte("created_at", inicio);
  if (filtros.bloco !== "todos") consulta = consulta.eq("bloco", filtros.bloco);

  const { data, error } = await consulta;
  if (error) throw error;

  const termo = filtros.busca.trim().toLowerCase();
  const linhas = ((data ?? []) as Linha[]).filter(
    (l) =>
      !termo ||
      l.slug_origem.toLowerCase().includes(termo) ||
      l.slug_alvo.toLowerCase().includes(termo),
  );

  const totalViews = linhas.filter((l) => l.evento !== "click").length;
  const totalCliques = linhas.filter((l) => l.evento === "click").length;

  return {
    totalViews,
    totalCliques,
    ctr: totalViews > 0 ? (totalCliques / totalViews) * 100 : 0,
    porPost: agrupar(linhas, (l) => [l.slug_origem, "—", l.bloco]),
    porAlvo: agrupar(linhas, (l) => ["—", l.slug_alvo, l.bloco]),
    pares: agrupar(linhas, (l) => [l.slug_origem, l.slug_alvo, l.bloco]),
  };
}

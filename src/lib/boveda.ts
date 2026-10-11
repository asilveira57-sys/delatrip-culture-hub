/**
 * Calculadora Boveda — funções puras. Recomenda tamanho, quantidade e % de
 * umidade e casa a recomendação com o estoque disponível.
 */
import { BOVEDA_OVERRIDES } from "@/config/boveda";

export type Consumo = "enrolo" | "outro";
export type Clima = "umido" | "seco" | "nao-sei";
export type Local = "tubo" | "hermetica" | "madeira" | "cooler" | "cachimbo";
export type Preferencia = "normal" | "seco" | "umido";

export type EntradaFlores = { tipo: "flores"; gramas: number; consumo: Consumo; clima: Clima };
export type EntradaCharutos = {
  tipo: "charutos";
  local: Local;
  /** Nº de charutos que o recipiente comporta (humidor/caixa/cooler). */
  capacidade?: number | undefined;
  /** Gramas de tabaco de cachimbo. */
  gramas?: number | undefined;
  /** Humidor de madeira nunca usado. */
  novo?: boolean;
  preferencia?: Preferencia;
};
export type Entrada = EntradaFlores | EntradaCharutos;

export type Opcao = { tamanho: number; packs: number; ur: number; destaque?: boolean };

export type Ideal = {
  opcoes: Opcao[];
  ur: number;
  motivo: string;
  temperagem: Opcao | null;
};

export const RECIPIENTES = [
  { valor: "pote-pequeno", rotulo: "Pote pequeno / porta-pré-roll", gramas: 14 },
  { valor: "pote-pessoal", rotulo: "Pote pessoal / CVault / saquinho", gramas: 28 },
  { valor: "saco-grande", rotulo: "Saco grande", gramas: 450 },
  { valor: "bombona", rotulo: "Bombona / estoque", gramas: 2500 },
] as const;

/** Capacidade em gramas de flores por pack. */
const CAP_FLORES: Record<number, number> = { 4: 14, 8: 28, 67: 450, 320: 2500 };
/** Capacidade em nº de charutos por pack. */
const CAP_CHARUTOS: Record<number, number> = { 60: 25, 320: 125 };

export function precisaCapacidade(local: Local) {
  return local === "hermetica" || local === "madeira" || local === "cooler";
}

export function idealFlores(e: EntradaFlores): Ideal {
  const g = Math.max(1, e.gramas);
  const ur = e.consumo === "enrolo" && e.clima !== "seco" ? 58 : 62;
  let opcao: Opcao;
  if (g <= 14) opcao = { tamanho: 4, packs: 1, ur };
  else if (g <= 28) opcao = { tamanho: 8, packs: 1, ur };
  else if (g <= 450) opcao = { tamanho: 67, packs: 1, ur };
  else opcao = { tamanho: 320, packs: Math.ceil(g / 2500), ur };
  const motivo =
    ur === 58
      ? "58% deixa a flor um pouco mais seca, bom para enrolar."
      : "62% deixa a flor mais macia, bom para clima seco e altitude — e é o padrão mais versátil.";
  return { opcoes: [opcao], ur, motivo, temperagem: null };
}

export function urCharutos(e: EntradaCharutos) {
  if (e.local === "cachimbo") return 65;
  if (e.preferencia === "seco") return 65;
  if (e.preferencia === "umido") return 75;
  return e.local === "madeira" ? 72 : 69;
}

export function idealCharutos(e: EntradaCharutos): Ideal {
  const ur = urCharutos(e);
  if (e.local === "tubo") {
    return {
      opcoes: [{ tamanho: 8, packs: 1, ur }],
      ur,
      motivo: "Para tubo, bolsa ou estojo de viagem, use 1 pack Size 8 por recipiente.",
      temperagem: null,
    };
  }
  if (e.local === "cachimbo") {
    const packs = Math.max(1, Math.ceil((e.gramas ?? 450) / 450));
    return {
      opcoes: [{ tamanho: 60, packs, ur }],
      ur,
      motivo: "Tabaco de cachimbo fica no ponto a 65%: 1 pack Size 60 a cada ~450 g.",
      temperagem: null,
    };
  }
  const cap = Math.max(1, e.capacidade ?? 25);
  const p60 = Math.ceil(cap / 25);
  const p320 = cap <= 125 ? 1 : Math.ceil(cap / 100);
  const opcoes: Opcao[] = [
    { tamanho: 60, packs: p60, ur, destaque: cap < 100 },
    { tamanho: 320, packs: p320, ur, destaque: cap >= 100 },
  ];
  const motivo =
    e.local === "madeira"
      ? `Humidor de madeira absorve umidade; ${ur}% mantém os charutos no ponto.`
      : `Recipientes fechados sem madeira trabalham bem com ${ur}%.`;
  const temperagem = e.local === "madeira" && e.novo ? { tamanho: 60, packs: p60, ur: 84 } : null;
  return { opcoes, ur, motivo, temperagem };
}

export function ideal(e: Entrada): Ideal {
  return e.tipo === "flores" ? idealFlores(e) : idealCharutos(e);
}

/* ---------------- estoque ---------------- */

export type ItemEstoque<P = unknown> = { produto: P; slug: string; tamanho: number; ur: number; unidades: number };

/** Lê tamanho, % e unidades pelo nome (ou pelo mapa de correções). */
export function lerSku<P>(produto: P & { slug: string; nome: string }): ItemEstoque<P> | null {
  const o = BOVEDA_OVERRIDES[produto.slug];
  if (o) return { produto, slug: produto.slug, ...o };
  const ur = produto.nome.match(/(\d{2})\s*%/);
  const tam = produto.nome.match(/(\d+)\s*g\b/i);
  if (!ur || !tam) return null;
  const un = produto.nome.match(/com\s+(\d+)\s+unidades/i);
  return {
    produto,
    slug: produto.slug,
    ur: Number(ur[1]),
    tamanho: Number(tam[1]),
    unidades: un ? Number(un[1]) : 1,
  };
}

export function equivalentes(ur: number, tipo: Entrada["tipo"]): number[] {
  if (tipo === "flores") return ur === 58 ? [62] : ur === 62 ? [58] : [];
  const viz: Record<number, number[]> = { 65: [69], 69: [65, 72], 72: [69, 75], 75: [72] };
  return viz[ur] ?? [];
}

function urPermitida(ur: number, tipo: Entrada["tipo"]) {
  if (ur === 84) return false;
  return tipo === "flores" ? ur < 65 : ur >= 65;
}

export type Casamento<P = unknown> =
  | { tipo: "exato"; item: ItemEstoque<P>; opcao: Opcao; embalagens: number }
  | { tipo: "alternativa"; item: ItemEstoque<P>; opcao: Opcao; embalagens: number; urEquivalente: boolean }
  | { tipo: "indisponivel" };

export const MAX_PACKS_ALTERNATIVA = 20;

function packsAlternativos(e: Entrada, tamanho: number, idealOpcao: Opcao): number | null {
  if (e.tipo === "flores") {
    const cap = CAP_FLORES[tamanho];
    return cap ? Math.max(1, Math.ceil(Math.max(1, e.gramas) / cap)) : null;
  }
  if (e.local === "tubo" || e.local === "cachimbo") {
    return tamanho === idealOpcao.tamanho ? idealOpcao.packs : null;
  }
  const cap = CAP_CHARUTOS[tamanho];
  return cap ? Math.max(1, Math.ceil(Math.max(1, e.capacidade ?? 25) / cap)) : null;
}

export function casarEstoque<P>(e: Entrada, idealR: Ideal, estoque: ItemEstoque<P>[]): Casamento<P> {
  const validos = estoque.filter((i) => urPermitida(i.ur, e.tipo));
  // 1. Exato (prioriza a opção em destaque)
  const ordem = [...idealR.opcoes].sort((a, b) => Number(!!b.destaque) - Number(!!a.destaque));
  for (const op of ordem) {
    const item = validos.find((i) => i.tamanho === op.tamanho && i.ur === op.ur);
    if (item) return { tipo: "exato", item, opcao: op, embalagens: Math.ceil(op.packs / item.unidades) };
  }
  // 2. Alternativa
  const base = idealR.opcoes[0]!;
  const eqs = equivalentes(idealR.ur, e.tipo);
  let melhor: Extract<Casamento<P>, { tipo: "alternativa" }> | null = null;
  for (const item of validos) {
    const mesma = item.ur === idealR.ur;
    if (!mesma && !eqs.includes(item.ur)) continue;
    const packs = packsAlternativos(e, item.tamanho, base);
    if (packs === null || packs > MAX_PACKS_ALTERNATIVA) continue;
    const cand = {
      tipo: "alternativa" as const,
      item,
      opcao: { tamanho: item.tamanho, packs, ur: item.ur },
      embalagens: Math.ceil(packs / item.unidades),
      urEquivalente: !mesma,
    };
    if (
      !melhor ||
      Number(cand.urEquivalente) - Number(melhor.urEquivalente) < 0 ||
      (cand.urEquivalente === melhor.urEquivalente && cand.embalagens < melhor.embalagens)
    )
      melhor = cand;
  }
  return melhor ?? { tipo: "indisponivel" };
}

export function rotuloOpcao(o: Opcao) {
  return `${o.packs}× Boveda Size ${o.tamanho} · ${o.ur}%`;
}

/** Gera o conteúdo .ics de um lembrete de dia inteiro. */
export function gerarIcs(data: Date, titulo: string, descricao: string) {
  const d = (x: Date) =>
    `${x.getFullYear()}${String(x.getMonth() + 1).padStart(2, "0")}${String(x.getDate()).padStart(2, "0")}`;
  const fim = new Date(data);
  fim.setDate(fim.getDate() + 1);
  const esc = (s: string) => s.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//DeLaTrip//Calculadora Boveda//PT",
    "BEGIN:VEVENT",
    `UID:boveda-${d(data)}-${Math.random().toString(36).slice(2)}@delatrip`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`,
    `DTSTART;VALUE=DATE:${d(data)}`,
    `DTEND;VALUE=DATE:${d(fim)}`,
    `SUMMARY:${esc(titulo)}`,
    `DESCRIPTION:${esc(descricao)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

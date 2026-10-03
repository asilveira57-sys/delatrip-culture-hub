import { supabase } from "@/integrations/supabase/client";
import { ETAPAS, LINHAS, NIVEIS, NIVEL_TODOS, nivelAtende, type Etapa, type Linha, type Nivel } from "@/config/guia-perfis";
import { getAnonId } from "@/lib/anon-id";
import { lerConsentimento } from "@/lib/consentimento";
import { getCategoryById, getProduct, products, rootOf, type Product } from "@/lib/catalog";
import type { OverlayMap } from "@/lib/overlay";

export type Papel = "principal" | "complemento" | "armazenamento" | "transporte";
export const ROTULO_PAPEL: Record<Papel, string> = {
  principal: "Principal",
  complemento: "Complemento",
  armazenamento: "Armazenamento",
  transporte: "Transporte",
};

export type Foco = "kit" | "melhorar" | "organizar" | "presente";
export type Peso = "praticidade" | "durabilidade" | "visual";
export type Formato = "1-14" | "king-size" | "cone" | "nao-sei";

/** Rótulos públicos da linha (sem falar de preço). */
export const ROTULO_LINHA_PUBLICA: Record<Linha, string> = {
  entrada: "Econômica",
  normal: "Equilibrada",
  premium: "Premium",
};

export const PERFIS: Record<Nivel, { nome: string; frase: string; texto: string }> = {
  explorador: {
    nome: "Explorador",
    frase: "Está começando e quer entender o básico de cada item.",
    texto:
      "Você está dando os primeiros passos. O ideal é um conjunto simples e funcional: seda em tamanho clássico, piteira, um dichavador leve e um lugar para guardar tudo.",
  },
  familiarizado: {
    nome: "Familiarizado",
    frase: "Já conhece o básico e busca mais praticidade no dia a dia.",
    texto:
      "Você já sabe o que usa. Agora vale investir em conveniência: cases, carteiras e itens de organização que deixam tudo à mão e protegido.",
  },
  entusiasta: {
    nome: "Entusiasta",
    frase: "Tem preferências claras e gosta de personalizar o conjunto.",
    texto:
      "Você tem preferências definidas. Formatos especiais, materiais como alumínio e madeira e acabamentos diferenciados combinam com o seu momento.",
  },
  especialista: {
    nome: "Especialista",
    frase: "Sabe exatamente o que quer e valoriza peças de alto padrão.",
    texto:
      "Você conhece os detalhes. Peças em vidro, metal usinado e itens de coleção, com foco em durabilidade e acabamento superior.",
  },
};

export type ItemKit = { produto: Product; papel: Papel };

type KitBanco = {
  slug: string;
  nome: string;
  nivel: string | null;
  linha: string | null;
  ordem: number;
  guia_kit_item: { produto_slug: string; papel: Papel; ordem: number }[];
};

export async function listarKitsAtivos(): Promise<KitBanco[]> {
  const { data, error } = await supabase
    .from("guia_kit")
    .select("slug, nome, nivel, linha, ordem, guia_kit_item(produto_slug, papel, ordem)")
    .eq("ativo", true)
    .order("ordem");
  if (error || !data) return [];
  return data as unknown as KitBanco[];
}

const slugsDe = (p: Product) => {
  const cat = getCategoryById(p.categoriaId);
  return cat ? { folha: cat.slug, raiz: rootOf(cat).slug } : { folha: "", raiz: "" };
};

const ARMAZENAMENTO = new Set(["cases", "case", "potes-reservatorio", "lata-estojo", "zip-lock"]);
const TRANSPORTE = new Set(["carteiras"]);
const DURAVEIS = /metal|alum[ií]nio|vidro|a[cç]o/i;

function elegiveis(ov: OverlayMap) {
  return products.filter((p) => {
    const o = ov.get(p.slug);
    return p.disponivel && !o?.oculto && !o?.fora_do_guia && slugsDe(p).raiz !== "vestuario";
  });
}

function ordenar(lista: Product[], linha: Linha, peso: Peso | undefined, ov: OverlayMap) {
  const pts = (p: Product) =>
    (ov.get(p.slug)?.linha === linha ? 4 : 0) +
    (peso === "durabilidade" && DURAVEIS.test(`${p.nome} ${slugsDe(p).folha}`) ? 3 : 0) +
    (p.destaque ? 1 : 0);
  return [...lista].sort((a, b) => pts(b) - pts(a) || b.estoque - a.estoque);
}

function linhaProxima(alvo: Linha): Linha[] {
  const i = LINHAS.indexOf(alvo);
  return [...LINHAS].sort((a, b) => Math.abs(LINHAS.indexOf(a) - i) - Math.abs(LINHAS.indexOf(b) - i));
}

export function montarConjunto(opts: {
  nivel: Nivel;
  linha: Linha;
  foco?: Foco | undefined;
  peso?: Peso | undefined;
  formato?: Formato | undefined;
  kits: KitBanco[];
  overlays: OverlayMap;
}): { itens: ItemKit[]; kitNome: string | null } {
  const { nivel, foco, peso, formato, kits, overlays: ov } = opts;
  const linha: Linha = foco === "presente" ? "premium" : opts.linha;
  const visivel = (s: string) => {
    const p = getProduct(s);
    const o = ov.get(s);
    return p && p.disponivel && !o?.oculto ? p : undefined;
  };

  let itens: ItemKit[] = [];
  let kitNome: string | null = null;
  for (const l of linhaProxima(linha)) {
    const kit = kits.find((k) => k.nivel === nivel && k.linha === l);
    if (!kit) continue;
    itens = [...kit.guia_kit_item]
      .sort((a, b) => a.ordem - b.ordem)
      .map((i) => ({ produto: visivel(i.produto_slug)!, papel: i.papel }))
      .filter((i) => i.produto);
    if (itens.length) {
      kitNome = kit.nome;
      break;
    }
  }

  if (!itens.length) {
    const base = elegiveis(ov);
    const usados = new Set<string>();
    const pega = (lista: Product[]) => {
      const p = ordenar(lista.filter((x) => !usados.has(x.slug)), linha, peso, ov)[0];
      if (p) usados.add(p.slug);
      return p;
    };
    const essenciais = base.filter((p) => ov.get(p.slug)?.etapa === "essencial");
    const doNivel = essenciais.filter((p) => nivelAtende(ov.get(p.slug)?.nivel, nivel));
    let candidatos = doNivel.length ? doNivel : essenciais;
    if (formato && formato !== "nao-sei") {
      const f = candidatos.filter((p) => slugsDe(p).raiz === "sedas" && slugsDe(p).folha === formato);
      if (f.length) candidatos = f;
    }
    const principal = pega(candidatos);
    const complemento = principal
      ? pega(essenciais.filter((p) => slugsDe(p).raiz !== slugsDe(principal).raiz))
      : undefined;
    const arm = pega(base.filter((p) => ARMAZENAMENTO.has(slugsDe(p).folha)));
    const tra = pega(base.filter((p) => TRANSPORTE.has(slugsDe(p).folha)));
    const add = (p: Product | undefined, papel: Papel) => p && itens.push({ produto: p, papel });
    add(principal, "principal");
    add(complemento, "complemento");
    add(arm, "armazenamento");
    add(tra, "transporte");
  }

  if (peso === "durabilidade") {
    itens.sort(
      (a, b) =>
        Number(DURAVEIS.test(b.produto.nome)) - Number(DURAVEIS.test(a.produto.nome)),
    );
  }
  if (foco === "organizar") {
    const prio = (p: Papel) => (p === "armazenamento" || p === "transporte" ? 0 : 1);
    itens.sort((a, b) => prio(a.papel) - prio(b.papel));
  }
  return { itens, kitNome };
}

/** Até 6 produtos da etapa seguinte, mesmo nível ou um acima. */
export function depoisExplore(nivel: Nivel, linha: Linha, ov: OverlayMap, excluir: Set<string>) {
  const niveis = new Set([nivel, NIVEIS[NIVEIS.indexOf(nivel) + 1]].filter(Boolean));
  const etapaAtual: Etapa = (["essencial", "conveniencia", "personalizacao", "premium"] as Etapa[])[
    NIVEIS.indexOf(nivel)
  ]!;
  const proxima = ETAPAS[Math.min(ETAPAS.indexOf(etapaAtual) + 1, ETAPAS.length - 1)];
  const lista = elegiveis(ov).filter((p) => {
    const o = ov.get(p.slug);
    return !excluir.has(p.slug) && o?.etapa === proxima && (niveis.has(o?.nivel as Nivel) || o?.nivel === NIVEL_TODOS);
  });
  return ordenar(lista, linha, undefined, ov).slice(0, 6);
}

export type EventoGuia = "quiz_iniciado" | "quiz_concluido" | "clique_produto_kit";

/** Evento anônimo; só é enviado com consentimento de análise. */
export function registrarEventoGuia(
  evento: EventoGuia,
  dados: { nivel?: string | undefined; linha?: string | undefined; produto?: string | undefined } = {},
) {
  if (typeof window === "undefined") return;
  if (!lerConsentimento()?.categorias.analise) return;
  const camada = (window as unknown as { dataLayer?: unknown[] }).dataLayer;
  if (Array.isArray(camada)) camada.push({ event: evento, ...dados });
  void supabase.rpc("registrar_evento_guia" as never, {
    p_evento: evento,
    p_nivel: dados.nivel ?? "",
    p_linha: dados.linha ?? "",
    p_produto_slug: dados.produto ?? "",
    p_anon_id: getAnonId() ?? "",
  } as never);
}

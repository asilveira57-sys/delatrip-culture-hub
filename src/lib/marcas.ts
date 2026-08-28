import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { brands as brandsJson, productsByBrand, type Brand, type Product } from "@/lib/catalog";
import { produtosPorMarca, type MarcaDeProdutos } from "@/lib/marcas-produtos";

/**
 * Camada de gestão de marcas.
 *
 * O catálogo continua vindo do export da Tray (src/data/brands.json). A tabela
 * `marca_overlay` guarda apenas as alterações feitas no admin:
 *  - `nome`        → renomeia a marca no site inteiro;
 *  - `mesclar_em`  → marca duplicada que passa a apontar para a principal;
 *  - `oculto`      → remove a marca do site (sem apagar o JSON de origem);
 *  - `manual`      → marca criada no admin, inexistente no export da loja.
 */
export type MarcaOverlay = {
  slug: string;
  nome: string | null;
  mesclar_em: string | null;
  oculto: boolean;
  manual: boolean;
};

export type MarcaMapa = Map<string, MarcaOverlay>;

const VAZIO: MarcaMapa = new Map();

export async function fetchMarcaOverlays(): Promise<MarcaMapa> {
  try {
    const { data, error } = await supabase
      .from("marca_overlay")
      .select("slug, nome, mesclar_em, oculto, manual")
      .limit(2000);
    if (error || !data) return VAZIO;
    return new Map((data as MarcaOverlay[]).map((m) => [m.slug, m]));
  } catch {
    return VAZIO;
  }
}

export function useMarcaOverlays(): MarcaMapa {
  const { data } = useQuery({
    queryKey: ["marca_overlay"],
    queryFn: fetchMarcaOverlays,
    staleTime: 60 * 1000,
    retry: false,
  });
  return data ?? VAZIO;
}

/** Segue a cadeia de mesclagem até a marca principal (com proteção contra ciclos). */
export function slugCanonico(slug: string, mapa: MarcaMapa): string {
  let atual = slug;
  for (let i = 0; i < 5; i++) {
    const destino = mapa.get(atual)?.mesclar_em?.trim();
    if (!destino || destino === atual) break;
    atual = destino;
  }
  return atual;
}

/** Todos os slugs de origem cujos produtos pertencem à marca informada. */
export function slugsDaMarca(slug: string, mapa: MarcaMapa): string[] {
  const slugs = new Set<string>([slug]);
  for (const [origem] of mapa) {
    if (origem !== slug && slugCanonico(origem, mapa) === slug) slugs.add(origem);
  }
  return [...slugs];
}

/** Produtos da marca, somando duplicadas mescladas e transferências do admin. */
export function produtosDaMarca(
  slug: string,
  mapa: MarcaMapa,
  produtoMarcas?: MarcaDeProdutos,
): Product[] {
  const slugs = slugsDaMarca(slug, mapa);
  if (produtoMarcas && produtoMarcas.size > 0) return produtosPorMarca(slugs, produtoMarcas);
  return slugs.flatMap((s) => productsByBrand(s));
}

function brandBase(slug: string): Brand | undefined {
  return brandsJson.find((b) => b.slug === slug);
}

function marcaManual(ov: MarcaOverlay): Brand {
  return {
    nome: ov.nome?.trim() || ov.slug,
    slug: ov.slug,
    totalProdutos: 0,
    categoriaId: null,
    marcaPropria: false,
    logo: null,
    descricao: null,
  };
}

/** Lista final de marcas do site: JSON + criadas no admin, renomeadas, sem ocultas/mescladas. */
export function marcasEfetivas(mapa: MarcaMapa): Brand[] {
  const base: Brand[] = [...brandsJson];
  for (const ov of mapa.values()) {
    if (ov.manual && !base.some((b) => b.slug === ov.slug)) base.push(marcaManual(ov));
  }

  const visiveis = base.filter((b) => {
    const ov = mapa.get(b.slug);
    if (ov?.oculto) return false;
    if (slugCanonico(b.slug, mapa) !== b.slug) return false;
    return true;
  });

  return visiveis
    .map((b) => ({
      ...b,
      nome: mapa.get(b.slug)?.nome?.trim() || b.nome,
      totalProdutos: slugsDaMarca(b.slug, mapa).reduce(
        (soma, s) => soma + (brandBase(s)?.totalProdutos ?? 0),
        0,
      ),
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

/** Marca resolvida para a página pública (aplica renome e marcas criadas no admin). */
export function marcaEfetiva(slug: string, mapa: MarcaMapa): Brand | undefined {
  const ov = mapa.get(slug);
  if (ov?.oculto) return undefined;
  const base = brandBase(slug) ?? (ov?.manual ? marcaManual(ov) : undefined);
  if (!base) return undefined;
  return {
    ...base,
    nome: ov?.nome?.trim() || base.nome,
    totalProdutos: slugsDaMarca(slug, mapa).reduce(
      (soma, s) => soma + (brandBase(s)?.totalProdutos ?? 0),
      0,
    ),
  };
}

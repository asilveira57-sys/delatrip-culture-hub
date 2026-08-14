import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { Product } from "@/lib/catalog";

/**
 * Camada de sobreposição editorial.
 *
 * O catálogo continua vindo do export da Tray (src/data/*.json). O banco guarda
 * apenas as linhas dos produtos que foram editados no admin. A mescla acontece
 * na renderização, amarrada pelo SLUG. Se o banco estiver indisponível, o site
 * cai de volta para o JSON puro — a sobreposição é enriquecimento, não
 * dependência.
 */
export type Overlay = {
  slug: string;
  descricao_html: string | null;
  seo_titulo: string | null;
  seo_descricao: string | null;
  oculto: boolean;
  destaque: boolean | null;
  status_revisao: string | null;
};

export type OverlayMap = Map<string, Overlay>;

const VAZIO: OverlayMap = new Map();

/** UMA consulta para todas as sobreposições, carregada uma única vez. */
export async function fetchOverlays(): Promise<OverlayMap> {
  try {
    const { data, error } = await supabase
      .from("produto_overlay")
      .select(
        "slug, descricao_html, seo_titulo, seo_descricao, oculto, destaque, status_revisao",
      )
      .limit(5000);
    if (error || !data) return VAZIO;
    return new Map((data as Overlay[]).map((o) => [o.slug, o]));
  } catch {
    return VAZIO;
  }
}

export function useOverlays(): OverlayMap {
  const { data } = useQuery({
    queryKey: ["produto_overlay"],
    queryFn: fetchOverlays,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
  return data ?? VAZIO;
}

export function isHidden(slug: string, overlays: OverlayMap) {
  return overlays.get(slug)?.oculto === true;
}

/** Aplica destaque sobreposto; demais campos do JSON permanecem. */
export function mergeProduct(produto: Product, overlays: OverlayMap): Product {
  const ov = overlays.get(produto.slug);
  if (!ov) return produto;
  return {
    ...produto,
    destaque: ov.destaque ?? produto.destaque,
  };
}

/** Remove ocultos e aplica sobreposições de uma lista de produtos. */
export function mergeList(lista: Product[], overlays: OverlayMap): Product[] {
  if (overlays.size === 0) return lista;
  const out: Product[] = [];
  for (const p of lista) {
    const ov = overlays.get(p.slug);
    if (ov?.oculto) continue;
    out.push(ov ? { ...p, destaque: ov.destaque ?? p.destaque } : p);
  }
  return out;
}

/** Hook de conveniência: lista já mesclada e sem produtos ocultos. */
export function useMergedProducts(lista: Product[]): Product[] {
  const overlays = useOverlays();
  return mergeList(lista, overlays);
}

/** Descrição enriquecida só entra quando o texto foi aprovado na revisão. */
export function overlayDescricao(ov: Overlay | undefined) {
  if (!ov) return null;
  if (!ov.descricao_html) return null;
  if (ov.status_revisao !== "aprovado") return null;
  return ov.descricao_html;
}

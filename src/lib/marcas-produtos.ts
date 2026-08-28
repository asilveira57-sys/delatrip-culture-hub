import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { getProduct, productsByBrand, type Product } from "@/lib/catalog";

/**
 * Transferência de produtos entre marcas.
 *
 * O catálogo continua vindo do export da Tray. A coluna `marca_slug` de
 * `produto_overlay` guarda apenas o remanejamento feito no admin:
 *  - `"outra-marca"` → o produto passa a pertencer a essa marca;
 *  - `""`            → o produto fica sem marca (ex.: a marca foi excluída).
 */
export type MarcaDeProdutos = Map<string, string>;

const VAZIO: MarcaDeProdutos = new Map();

export async function fetchMarcaDeProdutos(): Promise<MarcaDeProdutos> {
  try {
    const { data, error } = await supabase
      .from("produto_overlay")
      .select("slug, marca_slug")
      .not("marca_slug", "is", null)
      .limit(5000);
    if (error || !data) return VAZIO;
    return new Map(
      (data as { slug: string; marca_slug: string | null }[]).map((r) => [
        r.slug,
        (r.marca_slug ?? "").trim(),
      ]),
    );
  } catch {
    return VAZIO;
  }
}

export function useMarcaDeProdutos(): MarcaDeProdutos {
  const { data } = useQuery({
    queryKey: ["produto_marca"],
    queryFn: fetchMarcaDeProdutos,
    staleTime: 60 * 1000,
    retry: false,
  });
  return data ?? VAZIO;
}

/** Marca efetiva do produto (aplica a transferência feita no admin). */
export function marcaSlugEfetiva(produto: Product, mapa: MarcaDeProdutos): string | null {
  const forcada = mapa.get(produto.slug);
  if (forcada === undefined) return produto.marcaSlug;
  return forcada || null;
}

/** Produtos que pertencem a qualquer um dos slugs informados, já com transferências. */
export function produtosPorMarca(slugs: string[], mapa: MarcaDeProdutos): Product[] {
  const alvo = new Set(slugs);
  const out: Product[] = [];
  const vistos = new Set<string>();

  for (const s of slugs) {
    for (const p of productsByBrand(s)) {
      const forcada = mapa.get(p.slug);
      if (forcada !== undefined && !alvo.has(forcada)) continue;
      if (vistos.has(p.slug)) continue;
      vistos.add(p.slug);
      out.push(p);
    }
  }

  for (const [slugProduto, destino] of mapa) {
    if (!destino || !alvo.has(destino) || vistos.has(slugProduto)) continue;
    const p = getProduct(slugProduto);
    if (!p) continue;
    vistos.add(slugProduto);
    out.push(p);
  }

  return out;
}

/** Move produtos para outra marca (ou para "sem marca" quando destino é null). */
export async function transferirProdutos(slugs: string[], destino: string | null) {
  if (slugs.length === 0) return 0;
  const { error } = await supabase.from("produto_overlay").upsert(
    slugs.map((slug) => ({ slug, marca_slug: destino ?? "" })),
    { onConflict: "slug" },
  );
  if (error) throw new Error(error.message);
  return slugs.length;
}

/** Remove a transferência: o produto volta à marca do catálogo original. */
export async function restaurarMarcaDeProdutos(slugs: string[]) {
  if (slugs.length === 0) return;
  const { error } = await supabase
    .from("produto_overlay")
    .update({ marca_slug: null })
    .in("slug", slugs);
  if (error) throw new Error(error.message);
}

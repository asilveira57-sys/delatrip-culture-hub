import { supabase } from "@/integrations/supabase/client";
import brandsJson from "@/data/brands.json";
import type { MarcaOverlay } from "@/lib/marcas";

/** Marca como aparece na lista do admin: JSON de origem + alterações do banco. */
export type MarcaAdmin = {
  slug: string;
  nome: string;
  nomeOriginal: string | null;
  totalProdutos: number;
  oculto: boolean;
  manual: boolean;
  mesclarEm: string | null;
};

type BrandJson = { nome: string; slug: string; totalProdutos: number };

export function slugify(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export async function listarMarcasAdmin(): Promise<MarcaAdmin[]> {
  const { data, error } = await supabase
    .from("marca_overlay")
    .select("slug, nome, mesclar_em, oculto, manual")
    .limit(2000);
  if (error) throw new Error(error.message);

  const overlays = new Map<string, MarcaOverlay>(
    ((data ?? []) as MarcaOverlay[]).map((m) => [m.slug, m]),
  );

  const lista: MarcaAdmin[] = (brandsJson as BrandJson[]).map((b) => {
    const ov = overlays.get(b.slug);
    return {
      slug: b.slug,
      nome: ov?.nome?.trim() || b.nome,
      nomeOriginal: b.nome,
      totalProdutos: b.totalProdutos,
      oculto: ov?.oculto ?? false,
      manual: false,
      mesclarEm: ov?.mesclar_em?.trim() || null,
    };
  });

  for (const ov of overlays.values()) {
    if (!ov.manual || lista.some((m) => m.slug === ov.slug)) continue;
    lista.push({
      slug: ov.slug,
      nome: ov.nome?.trim() || ov.slug,
      nomeOriginal: null,
      totalProdutos: 0,
      oculto: ov.oculto,
      manual: true,
      mesclarEm: ov.mesclar_em?.trim() || null,
    });
  }

  return lista.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

export async function salvarMarcaAdmin(entrada: {
  slug: string;
  nome?: string | null;
  mesclarEm?: string | null;
  oculto?: boolean;
  manual?: boolean;
}) {
  const { error } = await supabase.from("marca_overlay").upsert(
    {
      slug: entrada.slug,
      nome: entrada.nome?.trim() || null,
      mesclar_em: entrada.mesclarEm?.trim() || null,
      oculto: entrada.oculto ?? false,
      manual: entrada.manual ?? false,
    },
    { onConflict: "slug" },
  );
  if (error) throw new Error(error.message);
}

/** Cria uma marca que não existe no export da loja. */
export async function criarMarcaAdmin(nome: string) {
  const slug = slugify(nome);
  if (!slug) throw new Error("Informe um nome válido para a marca.");
  if ((brandsJson as BrandJson[]).some((b) => b.slug === slug)) {
    throw new Error("Já existe uma marca com esse nome no catálogo.");
  }
  const { error } = await supabase
    .from("marca_overlay")
    .insert({ slug, nome: nome.trim(), manual: true });
  if (error) {
    throw new Error(
      error.code === "23505" ? "Já existe uma marca com esse nome." : error.message,
    );
  }
  return slug;
}

/**
 * Exclui a marca. Marcas criadas no admin somem de vez; marcas vindas do
 * catálogo só podem ser ocultadas (o JSON de origem é reimportado a cada
 * atualização da loja).
 */
export async function excluirMarcaAdmin(marca: MarcaAdmin) {
  if (marca.manual) {
    const { error } = await supabase.from("marca_overlay").delete().eq("slug", marca.slug);
    if (error) throw new Error(error.message);
    return;
  }
  await salvarMarcaAdmin({ slug: marca.slug, nome: marca.nome, oculto: true, mesclarEm: marca.mesclarEm });
}

/** Remove todas as alterações do admin para esta marca (volta ao original). */
export async function restaurarMarcaAdmin(slug: string) {
  const { error } = await supabase.from("marca_overlay").delete().eq("slug", slug);
  if (error) throw new Error(error.message);
}

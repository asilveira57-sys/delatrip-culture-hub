import { supabase } from "@/integrations/supabase/client";

export type Papel = "principal" | "complemento" | "armazenamento" | "transporte";
export const PAPEIS: Papel[] = ["principal", "complemento", "armazenamento", "transporte"];
export const ROTULO_PAPEL: Record<Papel, string> = {
  principal: "Principal",
  complemento: "Complemento",
  armazenamento: "Armazenamento",
  transporte: "Transporte",
};

export type KitItem = { produto_slug: string; papel: Papel; ordem: number };
export type Kit = {
  id?: string;
  slug: string;
  nome: string;
  descricao: string | null;
  nivel: string | null;
  linha: string | null;
  ordem: number;
  ativo: boolean;
  itens: KitItem[];
};

export async function listarKits(): Promise<Kit[]> {
  const { data, error } = await supabase
    .from("guia_kit")
    .select("id, slug, nome, descricao, nivel, linha, ordem, ativo, guia_kit_item(produto_slug, papel, ordem)")
    .order("ordem")
    .order("created_at");
  if (error) throw error;
  return (data ?? []).map((k) => {
    const { guia_kit_item, ...resto } = k as typeof k & { guia_kit_item: KitItem[] };
    return { ...resto, itens: [...(guia_kit_item ?? [])].sort((a, b) => a.ordem - b.ordem) };
  });
}

export async function salvarKit(kit: Kit): Promise<string> {
  const { itens, id, ...campos } = kit;
  const { data, error } = await supabase
    .from("guia_kit")
    .upsert((id ? { id, ...campos } : campos) as never, { onConflict: id ? "id" : "slug" })
    .select("id")
    .single();
  if (error) throw error;
  const kitId = data.id;
  const del = await supabase.from("guia_kit_item").delete().eq("kit_id", kitId);
  if (del.error) throw del.error;
  if (itens.length) {
    const { error: e } = await supabase.from("guia_kit_item").insert(
      itens.map((it, ordem) => ({ kit_id: kitId, produto_slug: it.produto_slug, papel: it.papel, ordem })),
    );
    if (e) throw e;
  }
  return kitId;
}

export async function atualizarKit(id: string, patch: { ativo?: boolean; ordem?: number }) {
  const { error } = await supabase.from("guia_kit").update(patch).eq("id", id);
  if (error) throw error;
}

export async function excluirKit(id: string) {
  const { error } = await supabase.from("guia_kit").delete().eq("id", id);
  if (error) throw error;
}

export async function relacionadosDe(slug: string): Promise<string[]> {
  const { data } = await supabase
    .from("produto_relacionado")
    .select("slug_destino")
    .eq("slug_origem", slug)
    .order("ordem");
  return (data ?? []).map((r) => r.slug_destino);
}

export function slugify(t: string) {
  return t
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

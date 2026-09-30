import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  GUIA_PERFIS,
  NIVEIS,
  NIVEL_DA_ETAPA,
  RAIZES_FORA_DO_GUIA,
  type Etapa,
  type Linha,
  type Nivel,
} from "@/config/guia-perfis";
import {
  ancestorsOf,
  categoriaRestrita,
  getCategoryById,
  products,
  rootOf,
  type Category,
  type Product,
} from "@/lib/catalog";

export type ResumoGuia = {
  total: number;
  porLinha: Record<string, number>;
  porEtapa: Record<string, number>;
  porNivel: Record<string, number>;
  foraDoGuia: number;
  semClassificacao: number;
};

const precoDe = (p: Product) =>
  p.precoPromocional && p.precoPromocional > 0 ? p.precoPromocional : p.preco;

function tercis(valores: number[]) {
  const v = [...valores].sort((a, b) => a - b);
  const q = (f: number) => v[Math.min(v.length - 1, Math.floor(f * (v.length - 1)))] ?? 0;
  return [q(0.33), q(0.66)] as const;
}

function etapaDe(cat: Category | undefined): Etapa | null {
  if (!cat) return null;
  const raiz = rootOf(cat);
  const cadeia = [...ancestorsOf(cat)].reverse().filter((c) => c.id !== raiz.id);
  for (const c of cadeia) {
    const e = GUIA_PERFIS[`${raiz.slug}/${c.slug}`];
    if (e) return e;
  }
  return GUIA_PERFIS[raiz.slug] ?? null;
}

/** Classifica linha, etapa e nível de todos os produtos e grava na sobreposição. */
export const classificarPerfis = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ slugs: z.array(z.string().max(200)).max(5000).optional() }).parse(d ?? {}),
  )
  .handler(async ({ data, context }): Promise<ResumoGuia> => {
    const alvo = data.slugs?.length ? new Set(data.slugs) : null;
    const { supabase } = context;

    const { data: existentes, error } = await supabase
      .from("produto_overlay")
      .select("slug, linha, linha_manual, nivel, etapa, perfil_manual")
      .limit(10000);
    if (error) throw new Error("Não foi possível ler as sobreposições.");
    const ovs = new Map((existentes ?? []).map((o) => [o.slug, o]));

    // Grupos de preço por folha e por raiz
    const porFolha = new Map<string, number[]>();
    const porRaiz = new Map<string, number[]>();
    for (const p of products) {
      const preco = precoDe(p);
      const cat = getCategoryById(p.categoriaId);
      if (!p.disponivel || !preco || !cat) continue;
      const r = rootOf(cat).id;
      (porFolha.get(cat.id) ?? porFolha.set(cat.id, []).get(cat.id)!).push(preco);
      (porRaiz.get(r) ?? porRaiz.set(r, []).get(r)!).push(preco);
    }
    const cacheT = new Map<string, readonly [number, number]>();
    const limites = (cat: Category) => {
      const folha = porFolha.get(cat.id) ?? [];
      const chave = folha.length >= 6 ? `f${cat.id}` : `r${rootOf(cat).id}`;
      if (!cacheT.has(chave)) {
        const vals = folha.length >= 6 ? folha : (porRaiz.get(rootOf(cat).id) ?? []);
        if (!vals.length) return null;
        cacheT.set(chave, tercis(vals));
      }
      return cacheT.get(chave)!;
    };

    const resumo: ResumoGuia = {
      total: 0,
      porLinha: { entrada: 0, normal: 0, premium: 0 },
      porEtapa: { essencial: 0, conveniencia: 0, personalizacao: 0, premium: 0 },
      porNivel: { explorador: 0, familiarizado: 0, entusiasta: 0, especialista: 0 },
      foraDoGuia: 0,
      semClassificacao: 0,
    };
    const linhas: Record<string, unknown>[] = [];

    for (const p of products) {
      if (alvo && !alvo.has(p.slug)) continue;
      resumo.total++;
      const cat = getCategoryById(p.categoriaId);
      const ov = ovs.get(p.slug);
      const fora = !!cat && (RAIZES_FORA_DO_GUIA.has(rootOf(cat).slug) || categoriaRestrita(cat));

      let linha = (ov?.linha as Linha | null) ?? null;
      if (!ov?.linha_manual) {
        linha = null;
        const preco = precoDe(p);
        const lim = cat && preco ? limites(cat) : null;
        if (lim && preco) linha = preco <= lim[0] ? "entrada" : preco <= lim[1] ? "normal" : "premium";
      }

      let etapa = (ov?.etapa as Etapa | null) ?? null;
      let nivel = (ov?.nivel as Nivel | null) ?? null;
      if (!ov?.perfil_manual) {
        etapa = fora ? null : etapaDe(cat);
        nivel = etapa ? NIVEL_DA_ETAPA[etapa] : null;
        if (nivel && linha === "premium" && (etapa === "essencial" || etapa === "conveniencia")) {
          nivel = NIVEIS[NIVEIS.indexOf(nivel) + 1] ?? nivel;
        }
      }

      if (linha) resumo.porLinha[linha] = (resumo.porLinha[linha] ?? 0) + 1;
      if (etapa) resumo.porEtapa[etapa] = (resumo.porEtapa[etapa] ?? 0) + 1;
      if (nivel) resumo.porNivel[nivel] = (resumo.porNivel[nivel] ?? 0) + 1;
      if (fora) resumo.foraDoGuia++;
      else if (!etapa || !nivel) resumo.semClassificacao++;

      const mudou =
        !ov ||
        ov.linha !== linha ||
        ov.etapa !== etapa ||
        ov.nivel !== nivel ||
        (ov as { fora_do_guia?: boolean }).fora_do_guia !== fora;
      if (mudou) linhas.push({ slug: p.slug, linha, etapa, nivel, fora_do_guia: fora });
    }

    // Upsert só com as colunas do guia: os demais campos do overlay ficam intactos.
    for (let i = 0; i < linhas.length; i += 500) {
      const { error: e } = await supabase
        .from("produto_overlay")
        .upsert(linhas.slice(i, i + 500) as never, { onConflict: "slug" });
      if (e) throw new Error("Falha ao gravar a classificação.");
    }
    return resumo;
  });

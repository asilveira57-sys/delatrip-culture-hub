import { createServerFn } from "@tanstack/react-start";

import type { Blocos, PaginaSeo } from "@/lib/paginas-core";
import { clientePublico } from "@/lib/public-db.server";

export type PaginaCarregada = { blocos: Blocos | null; seo: PaginaSeo | null };

/** Blocos editáveis + SEO da rota; nulos quando não há registro no banco. */
export const carregarPagina = createServerFn({ method: "GET" })
  .inputValidator((entrada: { caminho: string }) => entrada)
  .handler(async ({ data: entrada }): Promise<PaginaCarregada> => {
    const supabase = clientePublico();
    if (!supabase) return { blocos: null, seo: null };
    try {
      const [pagina, seo] = await Promise.all([
        supabase
          .from("pagina")
          .select("blocos")
          .eq("caminho", entrada.caminho)
          .maybeSingle(),
        supabase
          .from("seo_rota")
          .select("titulo, descricao, seo_keywords, noindex")
          .eq("caminho", entrada.caminho)
          .maybeSingle(),
      ]);

      const blocos =
        !pagina.error && pagina.data?.blocos && typeof pagina.data.blocos === "object"
          ? (pagina.data.blocos as Blocos)
          : null;

      const linha = seo.error ? null : seo.data;
      return {
        blocos,
        seo: linha
          ? {
              titulo: (linha.titulo as string | null) ?? null,
              descricao: (linha.descricao as string | null) ?? null,
              keywords: (linha.seo_keywords as string | null) ?? null,
              noindex: linha.noindex === true,
            }
          : null,
      };
    } catch {
      return { blocos: null, seo: null };
    }
  });

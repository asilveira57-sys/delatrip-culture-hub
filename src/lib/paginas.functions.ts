import { createServerFn } from "@tanstack/react-start";

import type { Blocos } from "@/lib/paginas-core";
import { clientePublico } from "@/lib/public-db.server";

/** Blocos editáveis de uma rota; vazio quando não há registro no banco. */
export const carregarPagina = createServerFn({ method: "GET" })
  .inputValidator((entrada: { caminho: string }) => entrada)
  .handler(async ({ data: entrada }): Promise<Blocos | null> => {
    const supabase = clientePublico();
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from("pagina")
        .select("blocos")
        .eq("caminho", entrada.caminho)
        .maybeSingle();
      if (error || !data?.blocos || typeof data.blocos !== "object") return null;
      return data.blocos as Blocos;
    } catch {
      return null;
    }
  });

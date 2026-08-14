import { useEffect, useState } from "react";
import { ThumbsUp } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { getAnonId } from "@/lib/anon-id";
import { cn } from "@/lib/utils";

type Props = {
  tipo: "produto" | "post";
  alvo: string;
  className?: string;
};

/**
 * Sinal social leve: protege contra clique repetido do mesmo navegador,
 * não contra fraude. A contagem nunca é usada para ordenar produtos.
 */
export function Curtir({ tipo, alvo, className }: Props) {
  const [total, setTotal] = useState(0);
  const [curtido, setCurtido] = useState(false);
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    let ativo = true;
    const anonId = getAnonId();

    (async () => {
      try {
        const [contagem, minha] = await Promise.all([
          supabase
            .from("curtida_contagem")
            .select("total")
            .eq("tipo", tipo)
            .eq("alvo", alvo)
            .maybeSingle(),
          anonId
            ? supabase
                .from("curtida")
                .select("id")
                .eq("tipo", tipo)
                .eq("alvo", alvo)
                .eq("anon_id", anonId)
                .maybeSingle()
            : Promise.resolve({ data: null }),
        ]);
        if (!ativo) return;
        setTotal(Number(contagem.data?.total ?? 0));
        setCurtido(Boolean(minha.data));
      } catch {
        /* banco indisponível: o botão continua visível, sem contagem */
      } finally {
        if (ativo) setPronto(true);
      }
    })();

    return () => {
      ativo = false;
    };
  }, [tipo, alvo]);

  async function alternar() {
    const anonId = getAnonId();
    if (!anonId) return;

    const proximo = !curtido;
    // Atualização otimista: o estado visual não espera o servidor.
    setCurtido(proximo);
    setTotal((t) => Math.max(0, t + (proximo ? 1 : -1)));

    try {
      const { data, error } = await supabase.rpc(proximo ? "curtir" : "descurtir", {
        p_tipo: tipo,
        p_alvo: alvo,
        p_anon_id: anonId,
      });
      if (error) throw error;
      if (typeof data === "number") setTotal(data);
    } catch {
      setCurtido(!proximo);
      setTotal((t) => Math.max(0, t + (proximo ? -1 : 1)));
    }
  }

  return (
    <button
      type="button"
      onClick={alternar}
      aria-pressed={curtido}
      aria-label={curtido ? "Remover curtida" : "Curtir"}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium transition-colors",
        curtido
          ? "border-primary bg-primary/10 text-primary"
          : "text-muted-foreground hover:border-primary hover:text-primary",
        className,
      )}
    >
      <ThumbsUp aria-hidden="true" className="size-4" />
      <span>{curtido ? "Curtido" : "Curtir"}</span>
      {pronto && total > 0 ? (
        <span className="tabular-nums text-xs opacity-80">{total}</span>
      ) : null}
    </button>
  );
}

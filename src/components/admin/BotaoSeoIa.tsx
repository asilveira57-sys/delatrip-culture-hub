import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { gerarSeoIa } from "@/lib/seo-ia.functions";
import { limparConteudo, type SeoGerado, type TipoSeo } from "@/lib/seo-ia-core";

const CHAVE_AUTO = "delatrip:seo-ia-auto";

type Props = {
  tipo: TipoSeo;
  /** Título/H1 da página; sem ele não há o que gerar. */
  titulo: string;
  /** Conteúdo (HTML ou texto) que serve de base para a IA. */
  contexto: string;
  extra?: string | null;
  /** True quando título, descrição e keywords ainda estão vazios. */
  vazio: boolean;
  onGerado: (seo: SeoGerado) => void;
};

export function BotaoSeoIa({ tipo, titulo, contexto, extra, vazio, onGerado }: Props) {
  const gerar = useServerFn(gerarSeoIa);
  const [carregando, setCarregando] = useState(false);
  const [auto, setAuto] = useState(false);
  const jaTentou = useRef(false);

  useEffect(() => {
    setAuto(localStorage.getItem(CHAVE_AUTO) === "1");
  }, []);

  async function executar(silencioso = false) {
    if (!titulo.trim()) {
      if (!silencioso) toast.error("Preencha o título antes de gerar o SEO.");
      return;
    }
    setCarregando(true);
    try {
      const r = await gerar({
        data: { tipo, titulo: titulo.trim(), contexto: contexto ?? "", extra: extra ?? null },
      });
      if (!r.ok) {
        if (!silencioso) toast.error(r.erro ?? "Falha ao gerar o SEO.");
        return;
      }
      onGerado({ titulo: r.titulo, descricao: r.descricao, keywords: r.keywords });
      toast.success("SEO gerado pela IA. Revise antes de salvar.");
    } finally {
      setCarregando(false);
    }
  }

  // Geração automática: só na primeira vez, só quando nada foi preenchido ainda.
  useEffect(() => {
    if (!auto || jaTentou.current || carregando) return;
    if (!vazio || !titulo.trim()) return;
    if (limparConteudo(contexto ?? "").length < 80) return;
    jaTentou.current = true;
    void executar(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, vazio, titulo, contexto]);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => void executar()}
        disabled={carregando}
      >
        <Sparkles className="size-4" /> {carregando ? "Gerando…" : "Gerar SEO com IA"}
      </Button>
      <label className="flex items-center gap-2 text-xs text-muted-foreground">
        <Switch
          checked={auto}
          onCheckedChange={(v) => {
            setAuto(v);
            localStorage.setItem(CHAVE_AUTO, v ? "1" : "0");
          }}
        />
        Gerar automaticamente quando estiver vazio
      </label>
    </div>
  );
}

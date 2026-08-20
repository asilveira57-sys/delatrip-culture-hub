import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ChevronDown, ChevronUp, Plus, Save, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { listarFaqAdmin, salvarFaqAdmin } from "@/lib/faq-admin";
import { limparConteudoFaq, type FaqLinha, type TipoFaq } from "@/lib/faq-core";
import { gerarFaqIa } from "@/lib/faq-ia.functions";

type Props = {
  tipo: TipoFaq;
  /** Slug (post/produto) ou slug da marca — chave da FAQ no banco. */
  alvo: string;
  titulo: string;
  contexto: string;
  extra?: string | null;
  /** Falso enquanto o conteúdo ainda não existe no banco (ex.: post novo). */
  habilitado?: boolean;
};

type Sugestao = { pergunta: string; resposta: string; aprovada: boolean };

export function FaqEditor({
  tipo,
  alvo,
  titulo,
  contexto,
  extra,
  habilitado = true,
}: Props) {
  const gerar = useServerFn(gerarFaqIa);
  const [itens, setItens] = useState<FaqLinha[]>([]);
  const [sugestoes, setSugestoes] = useState<Sugestao[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [gerando, setGerando] = useState(false);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!habilitado || !alvo) return;
    let ativo = true;
    setCarregando(true);
    listarFaqAdmin(tipo, alvo)
      .then((linhas) => {
        if (ativo) setItens(linhas);
      })
      .catch(() => toast.error("Não foi possível carregar a FAQ."))
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => {
      ativo = false;
    };
  }, [tipo, alvo, habilitado]);

  async function sugerir() {
    if (!titulo.trim()) {
      toast.error("Preencha o título antes de sugerir a FAQ.");
      return;
    }
    if (limparConteudoFaq(contexto ?? "").length < 80) {
      toast.error("Conteúdo curto demais para gerar perguntas.");
      return;
    }
    setGerando(true);
    try {
      const r = await gerar({
        data: { tipo, titulo: titulo.trim(), contexto: contexto ?? "", extra: extra ?? null },
      });
      if (!r.ok) {
        toast.error(r.erro ?? "Falha ao sugerir a FAQ.");
        return;
      }
      const existentes = new Set(itens.map((i) => i.pergunta.toLowerCase()));
      const novas = r.itens
        .filter((i) => !existentes.has(i.pergunta.toLowerCase()))
        .map((i) => ({ ...i, aprovada: true }));
      setSugestoes(novas);
      toast.success(`${novas.length} sugestão(ões) da IA. Revise e aprove.`);
    } finally {
      setGerando(false);
    }
  }

  function aprovarSelecionadas() {
    const aprovadas = sugestoes.filter((s) => s.aprovada);
    if (aprovadas.length === 0) {
      toast.error("Marque ao menos uma pergunta.");
      return;
    }
    setItens((atual) => [
      ...atual,
      ...aprovadas.map((s, i) => ({
        pergunta: s.pergunta,
        resposta: s.resposta,
        ordem: atual.length + i,
        origem: "ia",
      })),
    ]);
    setSugestoes([]);
    toast.success("Perguntas adicionadas. Não esqueça de salvar a FAQ.");
  }

  async function salvar() {
    setSalvando(true);
    try {
      await salvarFaqAdmin(tipo, alvo, itens);
      setItens(await listarFaqAdmin(tipo, alvo));
      toast.success("FAQ salva.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao salvar a FAQ.");
    } finally {
      setSalvando(false);
    }
  }

  function mover(indice: number, direcao: -1 | 1) {
    setItens((atual) => {
      const destino = indice + direcao;
      if (destino < 0 || destino >= atual.length) return atual;
      const copia = [...atual];
      const [item] = copia.splice(indice, 1);
      copia.splice(destino, 0, item!);
      return copia.map((l, i) => ({ ...l, ordem: i }));
    });
  }

  function atualizar(indice: number, patch: Partial<FaqLinha>) {
    setItens((atual) => atual.map((l, i) => (i === indice ? { ...l, ...patch } : l)));
  }

  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase">Perguntas frequentes</h2>
          <p className="text-xs text-muted-foreground">
            A IA sugere a partir do texto; nada vai ao ar sem sua aprovação.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => void sugerir()}
            disabled={!habilitado || gerando}
          >
            <Sparkles className="size-4" /> {gerando ? "Sugerindo…" : "Sugerir FAQ com IA"}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => void salvar()}
            disabled={!habilitado || salvando}
          >
            <Save className="size-4" /> {salvando ? "Salvando…" : "Salvar FAQ"}
          </Button>
        </div>
      </div>

      {!habilitado ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Salve o conteúdo uma primeira vez para liberar a FAQ.
        </p>
      ) : null}

      {sugestoes.length > 0 ? (
        <div className="mt-4 rounded-md border border-primary/40 bg-primary/5 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase text-primary">
              Sugestões da IA ({sugestoes.filter((s) => s.aprovada).length}/{sugestoes.length})
            </p>
            <div className="flex gap-2">
              <Button type="button" size="sm" variant="ghost" onClick={() => setSugestoes([])}>
                Descartar
              </Button>
              <Button type="button" size="sm" onClick={aprovarSelecionadas}>
                Aprovar selecionadas
              </Button>
            </div>
          </div>
          <div className="mt-2 divide-y divide-border">
            {sugestoes.map((s, i) => (
              <Collapsible key={`${s.pergunta}-${i}`}>
                <div className="flex items-start gap-2 py-2">
                  <Checkbox
                    className="mt-1"
                    checked={s.aprovada}
                    onCheckedChange={(v) =>
                      setSugestoes((atual) =>
                        atual.map((item, idx) =>
                          idx === i ? { ...item, aprovada: v === true } : item,
                        ),
                      )
                    }
                  />
                  <CollapsibleTrigger className="flex-1 text-left text-sm font-medium">
                    {s.pergunta}
                  </CollapsibleTrigger>
                </div>
                <CollapsibleContent className="pb-3 pl-8 text-sm text-muted-foreground">
                  {s.resposta}
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-4 space-y-2">
        {carregando ? <p className="text-xs text-muted-foreground">Carregando…</p> : null}
        {!carregando && itens.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nenhuma pergunta cadastrada.</p>
        ) : null}

        {itens.map((item, i) => (
          <Collapsible key={item.id ?? `novo-${i}`} className="rounded-md border border-border">
            <div className="flex items-center gap-2 px-3 py-2">
              <CollapsibleTrigger className="flex-1 text-left text-sm font-medium">
                {item.pergunta || "(pergunta sem título)"}
              </CollapsibleTrigger>
              {item.origem === "ia" ? (
                <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">
                  IA
                </span>
              ) : null}
              <Button type="button" size="icon" variant="ghost" onClick={() => mover(i, -1)}>
                <ChevronUp className="size-4" />
              </Button>
              <Button type="button" size="icon" variant="ghost" onClick={() => mover(i, 1)}>
                <ChevronDown className="size-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => setItens((atual) => atual.filter((_, idx) => idx !== i))}
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
            <CollapsibleContent className="space-y-2 border-t border-border p-3">
              <Input
                value={item.pergunta}
                onChange={(e) => atualizar(i, { pergunta: e.target.value })}
                placeholder="Pergunta"
              />
              <Textarea
                rows={3}
                value={item.resposta}
                onChange={(e) => atualizar(i, { resposta: e.target.value })}
                placeholder="Resposta"
              />
            </CollapsibleContent>
          </Collapsible>
        ))}

        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!habilitado}
          onClick={() =>
            setItens((atual) => [
              ...atual,
              { pergunta: "", resposta: "", ordem: atual.length, origem: "manual" },
            ])
          }
        >
          <Plus className="size-4" /> Adicionar pergunta
        </Button>
      </div>
    </section>
  );
}

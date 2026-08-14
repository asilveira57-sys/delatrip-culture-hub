import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { carregarPaginaAdmin, salvarPaginaAdmin } from "@/lib/paginas-admin";
import type { JsonValor } from "@/lib/paginas-core";

export const Route = createFileRoute("/admin/_gate/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — Admin DeLaTrip" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: FaqAdminPage,
});

const CAMINHO = "/faq";

type Item = { pergunta: string; resposta: string; categoria: string };

function FaqAdminPage() {
  const [itens, setItens] = useState<Item[]>([]);
  const [seo, setSeo] = useState({
    caminho: CAMINHO,
    titulo: "",
    descricao: "",
    noindex: false,
  });
  const [salvando, setSalvando] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "pagina", CAMINHO],
    queryFn: () => carregarPaginaAdmin(CAMINHO),
    retry: false,
  });

  useEffect(() => {
    if (!data) return;
    const bruto = data.blocos["itens"];
    if (Array.isArray(bruto)) {
      setItens(
        bruto.map((i) => {
          const o = (i ?? {}) as Record<string, JsonValor>;
          return {
            pergunta: String(o["pergunta"] ?? ""),
            resposta: String(o["resposta"] ?? ""),
            categoria: String(o["categoria"] ?? ""),
          };
        }),
      );
    }
    setSeo(data.seo);
  }, [data]);

  function alterar(i: number, campo: keyof Item, valor: string) {
    setItens((atual) => atual.map((item, idx) => (idx === i ? { ...item, [campo]: valor } : item)));
  }

  function mover(i: number, delta: number) {
    setItens((atual) => {
      const destino = i + delta;
      if (destino < 0 || destino >= atual.length) return atual;
      const copia = [...atual];
      const [item] = copia.splice(i, 1);
      copia.splice(destino, 0, item!);
      return copia;
    });
  }

  async function salvar() {
    setSalvando(true);
    try {
      const limpos = itens.filter((i) => i.pergunta.trim());
      await salvarPaginaAdmin(
        CAMINHO,
        { itens: limpos as unknown as JsonValor },
        seo,
      );
      toast.success("FAQ salvo.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao salvar.");
    } finally {
      setSalvando(false);
    }
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Carregando…</p>;

  return (
    <div className="mx-auto max-w-3xl pb-16">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">FAQ</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Perguntas e respostas da página pública, com dados estruturados FAQPage.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() =>
              setItens((a) => [...a, { pergunta: "", resposta: "", categoria: "" }])
            }
          >
            <Plus className="size-4" /> Adicionar
          </Button>
          <Button onClick={() => void salvar()} disabled={salvando}>
            <Save className="size-4" /> {salvando ? "Salvando…" : "Salvar"}
          </Button>
        </div>
      </div>

      {itens.length === 0 ? (
        <p className="mt-6 rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
          Nenhum item cadastrado. Enquanto estiver vazio, o site mostra a lista padrão.
        </p>
      ) : null}

      <div className="mt-6 space-y-4">
        {itens.map((item, i) => (
          <section key={i} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-start gap-2">
              <div className="flex-1 space-y-3">
                <div>
                  <Label>Pergunta</Label>
                  <Input
                    value={item.pergunta}
                    onChange={(e) => alterar(i, "pergunta", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Categoria (opcional)</Label>
                  <Input
                    value={item.categoria}
                    onChange={(e) => alterar(i, "categoria", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Resposta</Label>
                  <RichTextEditor
                    valor={item.resposta}
                    onChange={(html) => alterar(i, "resposta", html)}
                    baseArquivo="faq"
                    minAltura="10rem"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => mover(i, -1)}
                  className="rounded p-1.5 hover:bg-muted"
                  title="Subir"
                >
                  <ArrowUp className="size-4" />
                </button>
                <button
                  onClick={() => mover(i, 1)}
                  className="rounded p-1.5 hover:bg-muted"
                  title="Descer"
                >
                  <ArrowDown className="size-4" />
                </button>
                <button
                  onClick={() => setItens((a) => a.filter((_, idx) => idx !== i))}
                  className="rounded p-1.5 text-destructive hover:bg-muted"
                  title="Remover"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

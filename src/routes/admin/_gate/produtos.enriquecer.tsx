import { useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Play, Square } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getCategoryById, getProduct, getProductDetail, products } from "@/lib/catalog";
import { MODELOS, MODELO_PADRAO, custoEstimado } from "@/lib/enriquecer-core";
import { enriquecerProduto } from "@/lib/enriquecer.functions";
import {
  estatisticasEnriquecimento,
  formatarUsd,
  listarOverlaysAdmin,
  statusOverlay,
} from "@/lib/produtos-admin";

const TAMANHO_LOTE = 15;

export const Route = createFileRoute("/admin/_gate/produtos/enriquecer")({
  validateSearch: (search: Record<string, unknown>) => ({
    slugs: typeof search["slugs"] === "string" ? (search["slugs"] as string) : "",
  }),
  head: () => ({
    meta: [
      { title: "Enriquecer textos — Admin DeLaTrip" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: EnriquecerPage,
});

type Linha = {
  slug: string;
  nome: string;
  estado: "fila" | "processando" | "aprovado" | "ressalva" | "erro";
  detalhe?: string;
  custo?: number;
};

function EnriquecerPage() {
  const { slugs } = Route.useSearch();
  const queryClient = useQueryClient();
  const enriquecer = useServerFn(enriquecerProduto);

  const [modelo, setModelo] = useState<string>(MODELO_PADRAO);
  const [escopo, setEscopo] = useState<"selecao" | "sem-texto">(
    slugs ? "selecao" : "sem-texto",
  );
  const [linhas, setLinhas] = useState<Linha[]>([]);
  const [rodando, setRodando] = useState(false);
  const parar = useRef(false);

  const { data: overlays } = useQuery({
    queryKey: ["admin", "overlays"],
    queryFn: listarOverlaysAdmin,
    retry: false,
  });
  const { data: stats } = useQuery({
    queryKey: ["admin", "enriquecimento-stats"],
    queryFn: estatisticasEnriquecimento,
    retry: false,
  });

  const selecao = useMemo(() => slugs.split(",").filter(Boolean), [slugs]);

  const fila = useMemo(() => {
    if (escopo === "selecao") return selecao;
    return products
      .filter((p) => statusOverlay(overlays?.get(p.slug)) === "original")
      .slice(0, 300)
      .map((p) => p.slug);
  }, [escopo, selecao, overlays]);

  const lote = fila.slice(0, TAMANHO_LOTE);
  const concluidos = linhas.filter((l) => l.estado !== "fila" && l.estado !== "processando");
  const custoRodada = linhas.reduce((s, l) => s + (l.custo ?? 0), 0);
  const estimativa = custoEstimado(modelo, lote.length * 900, lote.length * 400);

  async function processar() {
    if (lote.length === 0) return;
    parar.current = false;
    setRodando(true);
    setLinhas(
      lote.map((s) => ({
        slug: s,
        nome: getProduct(s)?.nome ?? s,
        estado: "fila" as const,
      })),
    );

    for (const slug of lote) {
      if (parar.current) break;
      setLinhas((ls) =>
        ls.map((l) => (l.slug === slug ? { ...l, estado: "processando" } : l)),
      );
      const produto = getProduct(slug);
      const detalhe = await getProductDetail(slug);
      try {
        const r = await enriquecer({
          data: {
            slug,
            nome: produto?.nome ?? slug,
            marca: produto?.marca ?? null,
            categoria: getCategoryById(produto?.categoriaId ?? null)?.nome ?? null,
            descricaoOriginal: detalhe?.descricaoHtml ?? "",
            modelo,
          },
        });
        setLinhas((ls) =>
          ls.map((l) =>
            l.slug === slug
              ? {
                  ...l,
                  estado: !r.ok ? "erro" : r.aprovado ? "aprovado" : "ressalva",
                  detalhe: r.erro ?? r.motivos.join(" · ") || "Passou nas verificações",
                  custo: r.custo,
                }
              : l,
          ),
        );
      } catch {
        setLinhas((ls) =>
          ls.map((l) =>
            l.slug === slug ? { ...l, estado: "erro", detalhe: "Falha na chamada" } : l,
          ),
        );
      }
    }

    setRodando(false);
    void queryClient.invalidateQueries({ queryKey: ["admin", "overlays"] });
    void queryClient.invalidateQueries({ queryKey: ["admin", "enriquecimento-stats"] });
    toast.success("Lote concluído. Todo texto gerado fica aguardando revisão humana.");
  }

  return (
    <div>
      <Button asChild size="sm" variant="ghost" className="-ml-2">
        <Link to="/admin/produtos">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Produtos
        </Link>
      </Button>
      <h1 className="mt-1 text-xl font-semibold">Enriquecer textos com IA</h1>
      <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
        A instrução é subtrativa: o modelo só reorganiza o que já existe na
        descrição da Tray. Nenhum texto entra no ar automaticamente — tudo fica
        como “aguardando revisão” até aprovação manual.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs uppercase text-muted-foreground">Textos gerados</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{stats?.gerados ?? 0}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs uppercase text-muted-foreground">Sem ressalvas</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{stats?.aprovados ?? 0}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs uppercase text-muted-foreground">Custo no mês</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {formatarUsd(stats?.custoMes ?? 0)}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs uppercase text-muted-foreground">Custo acumulado</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {formatarUsd(stats?.custoTotal ?? 0)}
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-4">
        <div>
          <p className="mb-1 text-xs text-muted-foreground">Modelo</p>
          <Select value={modelo} onValueChange={setModelo}>
            <SelectTrigger className="w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MODELOS.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <p className="mb-1 text-xs text-muted-foreground">Escopo</p>
          <Select value={escopo} onValueChange={(v) => setEscopo(v as typeof escopo)}>
            <SelectTrigger className="w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="selecao" disabled={selecao.length === 0}>
                Seleção da lista ({selecao.length})
              </SelectItem>
              <SelectItem value="sem-texto">Produtos ainda sem texto editorial</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="text-xs text-muted-foreground">
          Lote de {lote.length} de {fila.length} na fila · estimativa {formatarUsd(estimativa)}
        </div>
        <div className="ml-auto flex gap-2">
          {rodando ? (
            <Button variant="outline" onClick={() => (parar.current = true)}>
              <Square className="size-4" aria-hidden="true" />
              Parar
            </Button>
          ) : (
            <Button onClick={() => void processar()} disabled={lote.length === 0}>
              <Play className="size-4" aria-hidden="true" />
              Processar lote
            </Button>
          )}
        </div>
      </div>

      {linhas.length > 0 && (
        <div className="mt-6">
          <Progress value={(concluidos.length / linhas.length) * 100} />
          <p className="mt-2 text-xs text-muted-foreground">
            {concluidos.length}/{linhas.length} processados · custo da rodada{" "}
            {formatarUsd(custoRodada)}
          </p>

          <ul className="mt-3 divide-y divide-border rounded-lg border border-border bg-card text-sm">
            {linhas.map((l) => (
              <li key={l.slug} className="flex items-start justify-between gap-3 p-3">
                <div className="min-w-0">
                  <Link
                    to="/admin/produtos/$slug"
                    params={{ slug: l.slug }}
                    className="font-medium hover:text-primary"
                  >
                    {l.nome}
                  </Link>
                  {l.detalhe && (
                    <p className="text-xs text-muted-foreground">{l.detalhe}</p>
                  )}
                </div>
                <span
                  className={
                    l.estado === "aprovado"
                      ? "text-xs text-primary"
                      : l.estado === "ressalva"
                        ? "text-xs text-gold"
                        : l.estado === "erro"
                          ? "text-xs text-destructive"
                          : "text-xs text-muted-foreground"
                  }
                >
                  {l.estado}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

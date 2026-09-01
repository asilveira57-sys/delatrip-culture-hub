import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Download, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  carregarMetricas,
  type Bloco,
  type LinhaMetrica,
  type Periodo,
} from "@/lib/relacionados-metricas";

export const Route = createFileRoute("/admin/_gate/relacionados")({
  head: () => ({
    meta: [
      { title: "Relacionados — Admin DeLaTrip" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: RelacionadosMetricasPage,
});

const ROTULO_BLOCO: Record<string, string> = {
  produto: "Produto",
  post: "Conteúdo",
  link_interno: "Link interno",
};

function Cartao({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{titulo}</p>
      <p className="mt-1 text-2xl font-semibold">{valor}</p>
    </div>
  );
}

function Tabela({
  linhas,
  colunaOrigem,
  colunaAlvo,
}: {
  linhas: LinhaMetrica[];
  colunaOrigem?: string;
  colunaAlvo?: string;
}) {
  if (linhas.length === 0)
    return <p className="py-8 text-sm text-muted-foreground">Nenhum evento no período.</p>;

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
          <tr>
            {colunaOrigem ? <th className="p-3">{colunaOrigem}</th> : null}
            {colunaAlvo ? <th className="p-3">{colunaAlvo}</th> : null}
            <th className="p-3">Bloco</th>
            <th className="p-3 text-right">Views</th>
            <th className="p-3 text-right">Cliques</th>
            <th className="p-3 text-right">CTR</th>
          </tr>
        </thead>
        <tbody>
          {linhas.slice(0, 200).map((l) => (
            <tr key={`${l.bloco}-${l.slugOrigem}-${l.slugAlvo}`} className="border-t border-border">
              {colunaOrigem ? <td className="p-3 font-medium">{l.slugOrigem}</td> : null}
              {colunaAlvo ? <td className="p-3">{l.slugAlvo}</td> : null}
              <td className="p-3 text-muted-foreground">{ROTULO_BLOCO[l.bloco] ?? l.bloco}</td>
              <td className="p-3 text-right tabular-nums">{l.views}</td>
              <td className="p-3 text-right tabular-nums">{l.cliques}</td>
              <td className="p-3 text-right tabular-nums">{l.ctr.toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function escaparCsv(valor: string): string {
  return `"${valor.replaceAll('"', '""')}"`;
}

function paraCsv(linhas: LinhaMetrica[], incluirOrigem: boolean, incluirAlvo: boolean): string {
  const cabecalho = [
    ...(incluirOrigem ? ["post_origem"] : []),
    ...(incluirAlvo ? ["item_relacionado"] : []),
    "bloco",
    "views",
    "cliques",
    "ctr_percentual",
  ];
  const corpo = linhas.map((l) =>
    [
      ...(incluirOrigem ? [escaparCsv(l.slugOrigem)] : []),
      ...(incluirAlvo ? [escaparCsv(l.slugAlvo)] : []),
      escaparCsv(ROTULO_BLOCO[l.bloco] ?? l.bloco),
      l.views,
      l.cliques,
      l.ctr.toFixed(2).replace(".", ","),
    ].join(";"),
  );
  return [cabecalho.join(";"), ...corpo].join("\r\n");
}

function baixarCsv(nome: string, conteudo: string) {
  const blob = new Blob(["\uFEFF" + conteudo], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nome;
  link.click();
  URL.revokeObjectURL(url);
}

function RelacionadosMetricasPage() {
  const [periodo, setPeriodo] = useState<Periodo>("30");
  const [bloco, setBloco] = useState<Bloco>("todos");
  const [busca, setBusca] = useState("");

  const { data, isFetching, refetch } = useQuery({
    queryKey: ["admin", "relacionados-metricas", periodo, bloco, busca],
    queryFn: () => carregarMetricas({ periodo, bloco, busca }),
    retry: false,
  });

  const sufixoArquivo = `${periodo}dias-${bloco}${busca.trim() ? "-busca" : ""}`;

  function BotaoExportar({
    nome,
    linhas,
    incluirOrigem,
    incluirAlvo,
  }: {
    nome: string;
    linhas: LinhaMetrica[];
    incluirOrigem: boolean;
    incluirAlvo: boolean;
  }) {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled={linhas.length === 0}
        onClick={() =>
          baixarCsv(
            `relacionados-${nome}-${sufixoArquivo}.csv`,
            paraCsv(linhas, incluirOrigem, incluirAlvo),
          )
        }
      >
        <Download className="size-4" /> Exportar CSV
      </Button>
    );
  }

  return (
    <div className="pb-16">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Relacionados — desempenho</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Visualizações e cliques dos blocos de produtos e conteúdos relacionados.
          </p>
        </div>
        <Button variant="outline" onClick={() => void refetch()} disabled={isFetching}>
          <RefreshCw className="size-4" /> {isFetching ? "Atualizando…" : "Atualizar"}
        </Button>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label>Período</Label>
          <Select value={periodo} onValueChange={(v) => setPeriodo(v as Periodo)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
              <SelectItem value="todos">Todo o período</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Bloco</Label>
          <Select value={bloco} onValueChange={(v) => setBloco(v as Bloco)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="produto">Produtos relacionados</SelectItem>
              <SelectItem value="post">Conteúdos relacionados</SelectItem>
              <SelectItem value="link_interno">Links internos</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Buscar slug</Label>
          <Input
            value={busca}
            placeholder="post ou produto"
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Cartao titulo="Visualizações" valor={String(data?.totalViews ?? 0)} />
        <Cartao titulo="Cliques" valor={String(data?.totalCliques ?? 0)} />
        <Cartao titulo="CTR" valor={`${(data?.ctr ?? 0).toFixed(1)}%`} />
      </div>

      <Tabs defaultValue="posts" className="mt-8">
        <TabsList>
          <TabsTrigger value="posts">Por post</TabsTrigger>
          <TabsTrigger value="itens">Por item relacionado</TabsTrigger>
          <TabsTrigger value="pares">Post → item</TabsTrigger>
        </TabsList>
        <TabsContent value="posts" className="mt-4">
          <Tabela linhas={data?.porPost ?? []} colunaOrigem="Post de origem" />
        </TabsContent>
        <TabsContent value="itens" className="mt-4">
          <Tabela linhas={data?.porAlvo ?? []} colunaAlvo="Item relacionado" />
        </TabsContent>
        <TabsContent value="pares" className="mt-4">
          <Tabela
            linhas={data?.pares ?? []}
            colunaOrigem="Post de origem"
            colunaAlvo="Item relacionado"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

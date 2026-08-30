import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  carregarConfigGlobal,
  recalcularTodos,
  salvarConfigGlobal,
} from "@/lib/relacionamentos-admin";
import {
  CONFIG_GLOBAL_PADRAO,
  type ConfigGlobalRelacionamentos,
  type Pesos,
} from "@/lib/relacionamentos-core";

const PESOS: { chave: keyof Pesos; label: string }[] = [
  { chave: "titulo", label: "Título" },
  { chave: "categoria", label: "Categoria" },
  { chave: "tags", label: "Tags" },
  { chave: "conteudo", label: "Conteúdo" },
  { chave: "cluster", label: "Cluster" },
];

function Numero({
  label,
  valor,
  ajuda,
  onChange,
}: {
  label: string;
  valor: number;
  ajuda?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input
        type="number"
        min={0}
        max={100}
        value={valor}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
      />
      {ajuda ? <p className="text-xs text-muted-foreground">{ajuda}</p> : null}
    </div>
  );
}

/** Painel global do sistema de produtos e conteúdos relacionados. */
export function RelacionadosGlobal() {
  const [config, setConfig] = useState<ConfigGlobalRelacionamentos>(CONFIG_GLOBAL_PADRAO);
  const [salvando, setSalvando] = useState(false);
  const [progresso, setProgresso] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "relacionamentos", "global"],
    queryFn: carregarConfigGlobal,
    retry: false,
  });

  useEffect(() => {
    if (data) setConfig(data);
  }, [data]);

  async function salvar() {
    setSalvando(true);
    try {
      await salvarConfigGlobal(config);
      toast.success("Configuração de relacionados salva.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao salvar.");
    } finally {
      setSalvando(false);
    }
  }

  async function recalcular() {
    setProgresso("Preparando…");
    try {
      await salvarConfigGlobal(config);
      const resultado = await recalcularTodos((feitos, total) =>
        setProgresso(`Recalculando ${feitos} de ${total}…`),
      );
      toast.success(
        `Recálculo concluído em ${resultado.posts} postagens${
          resultado.falhas.length > 0 ? ` (${resultado.falhas.length} com falha)` : ""
        }.`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha no recálculo.");
    } finally {
      setProgresso(null);
    }
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Carregando…</p>;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Numero
          label="Produtos por postagem"
          valor={config.quantidadeProdutos}
          onChange={(v) => setConfig((c) => ({ ...c, quantidadeProdutos: v }))}
        />
        <Numero
          label="Conteúdos por postagem"
          valor={config.quantidadeConteudos}
          onChange={(v) => setConfig((c) => ({ ...c, quantidadeConteudos: v }))}
        />
        <Numero
          label="Score mínimo de produto"
          ajuda="Abaixo disso o produto não aparece no site."
          valor={config.minimoScoreProduto}
          onChange={(v) => setConfig((c) => ({ ...c, minimoScoreProduto: v }))}
        />
        <Numero
          label="Score mínimo de conteúdo"
          valor={config.minimoScoreConteudo}
          onChange={(v) => setConfig((c) => ({ ...c, minimoScoreConteudo: v }))}
        />
        <Numero
          label="Máximo de links internos sugeridos"
          valor={config.maxLinksInternos}
          onChange={(v) => setConfig((c) => ({ ...c, maxLinksInternos: v }))}
        />
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border p-3">
        <div>
          <Label>Exibir produtos sem estoque</Label>
          <p className="text-xs text-muted-foreground">
            Vale para todas as postagens que não definirem regra própria.
          </p>
        </div>
        <Switch
          checked={config.exibirSemEstoque}
          onCheckedChange={(v) => setConfig((c) => ({ ...c, exibirSemEstoque: v }))}
        />
      </div>

      <div>
        <Label>Pesos do cálculo de relevância</Label>
        <div className="mt-2 grid gap-4 sm:grid-cols-3">
          {PESOS.map(({ chave, label }) => (
            <Numero
              key={chave}
              label={label}
              valor={config.pesos[chave]}
              onChange={(v) =>
                setConfig((c) => ({ ...c, pesos: { ...c.pesos, [chave]: v } }))
              }
            />
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
        <Button onClick={() => void salvar()} disabled={salvando || progresso !== null}>
          <Save className="size-4" /> {salvando ? "Salvando…" : "Salvar configuração"}
        </Button>
        <Button
          variant="outline"
          onClick={() => void recalcular()}
          disabled={progresso !== null || salvando}
        >
          <RefreshCw className={`size-4 ${progresso ? "animate-spin" : ""}`} />
          {progresso ?? "Recalcular todas as postagens"}
        </Button>
        <p className="text-xs text-muted-foreground">
          O recálculo preserva seleções manuais, fixados e exclusões.
        </p>
      </div>
    </div>
  );
}

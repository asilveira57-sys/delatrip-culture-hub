import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowRightLeft, Plus, RotateCcw, Search } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { products } from "@/lib/catalog";
import { produtosDaMarca, useMarcaOverlays } from "@/lib/marcas";
import {
  restaurarMarcaDeProdutos,
  transferirProdutos,
  useMarcaDeProdutos,
} from "@/lib/marcas-produtos";
import type { MarcaAdmin } from "@/lib/marcas-admin";

/**
 * Gestão dos produtos que pertencem à marca: transferência em lote ou
 * individual para outra marca (ou para "sem marca").
 */
export function ProdutosDaMarca({
  slug,
  marcas,
}: {
  slug: string;
  marcas: MarcaAdmin[];
}) {
  const qc = useQueryClient();
  const marcasOv = useMarcaOverlays();
  const produtoMarcas = useMarcaDeProdutos();

  const [sel, setSel] = useState<Set<string>>(new Set());
  const [destino, setDestino] = useState("");
  const [termo, setTermo] = useState("");
  const [busca, setBusca] = useState("");

  const lista = useMemo(
    () => produtosDaMarca(slug, marcasOv, produtoMarcas),
    [slug, marcasOv, produtoMarcas],
  );

  const visiveis = useMemo(() => {
    const q = termo.trim().toLowerCase();
    return q ? lista.filter((p) => p.nome.toLowerCase().includes(q)) : lista;
  }, [lista, termo]);

  const candidatos = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (q.length < 2) return [];
    const jaTem = new Set(lista.map((p) => p.slug));
    return products
      .filter((p) => !jaTem.has(p.slug) && p.nome.toLowerCase().includes(q))
      .slice(0, 8);
  }, [busca, lista]);

  function invalidar() {
    void qc.invalidateQueries({ queryKey: ["produto_marca"] });
    void qc.invalidateQueries({ queryKey: ["produto_overlay"] });
    void qc.invalidateQueries({ queryKey: ["admin", "overlays"] });
  }

  const mover = useMutation({
    mutationFn: (entrada: { slugs: string[]; para: string | null }) =>
      transferirProdutos(entrada.slugs, entrada.para),
    onSuccess: (n, entrada) => {
      toast.success(
        entrada.para
          ? `${n} produto(s) transferido(s) para /${entrada.para}.`
          : `${n} produto(s) agora estão sem marca.`,
      );
      setSel(new Set());
      invalidar();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const restaurar = useMutation({
    mutationFn: (slugs: string[]) => restaurarMarcaDeProdutos(slugs),
    onSuccess: () => {
      toast.success("Produtos voltaram à marca do catálogo.");
      setSel(new Set());
      invalidar();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function alternar(s: string) {
    setSel((atual) => {
      const novo = new Set(atual);
      if (novo.has(s)) novo.delete(s);
      else novo.add(s);
      return novo;
    });
  }

  const outras = marcas.filter((m) => m.slug !== slug);

  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <h2 className="text-sm font-semibold uppercase">Produtos da marca</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        {lista.length} produto(s). Selecione e transfira em lote, ou use o botão de cada linha
        para mover um produto individualmente.
      </p>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative sm:max-w-xs sm:flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
            placeholder="Filtrar produtos da marca"
            aria-label="Filtrar produtos da marca"
            className="pl-9"
          />
        </div>
        <div className="flex flex-1 items-center gap-2">
          <Input
            list="marcas-destino"
            value={destino}
            onChange={(e) => setDestino(e.target.value.trim())}
            placeholder="slug da marca de destino"
            aria-label="Marca de destino"
          />
          <datalist id="marcas-destino">
            {outras.map((m) => (
              <option key={m.slug} value={m.slug}>
                {m.nome}
              </option>
            ))}
          </datalist>
          <Button
            size="sm"
            disabled={sel.size === 0 || !destino || mover.isPending}
            onClick={() => mover.mutate({ slugs: [...sel], para: destino })}
          >
            <ArrowRightLeft className="size-4" /> Transferir ({sel.size})
          </Button>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={sel.size === 0 || mover.isPending}
          onClick={() => mover.mutate({ slugs: [...sel], para: null })}
        >
          Deixar sem marca
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={sel.size === 0 || restaurar.isPending}
          onClick={() => restaurar.mutate([...sel])}
        >
          <RotateCcw className="size-4" /> Restaurar marca original
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() =>
            setSel(sel.size === visiveis.length ? new Set() : new Set(visiveis.map((p) => p.slug)))
          }
        >
          {sel.size === visiveis.length && visiveis.length > 0
            ? "Limpar seleção"
            : "Selecionar todos"}
        </Button>
      </div>

      <ul className="mt-3 max-h-96 divide-y divide-border overflow-y-auto rounded-md border border-border">
        {visiveis.map((p) => (
          <li key={p.slug} className="flex items-center gap-2 px-3 py-2 text-sm">
            <Checkbox
              checked={sel.has(p.slug)}
              onCheckedChange={() => alternar(p.slug)}
              aria-label={`Selecionar ${p.nome}`}
            />
            <span className="min-w-0 flex-1 truncate">{p.nome}</span>
            {produtoMarcas.has(p.slug) && (
              <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] uppercase text-primary">
                movido
              </span>
            )}
            <Button
              size="sm"
              variant="ghost"
              disabled={!destino || mover.isPending}
              title={destino ? `Mover para /${destino}` : "Informe a marca de destino"}
              onClick={() => mover.mutate({ slugs: [p.slug], para: destino })}
            >
              <ArrowRightLeft className="size-4" />
            </Button>
          </li>
        ))}
        {visiveis.length === 0 && (
          <li className="px-3 py-4 text-xs text-muted-foreground">Nenhum produto nesta marca.</li>
        )}
      </ul>

      <div className="mt-4">
        <Label htmlFor="add-produto">Trazer produto de outra marca</Label>
        <Input
          id="add-produto"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar produto pelo nome"
        />
        {candidatos.length > 0 && (
          <ul className="mt-2 divide-y divide-border rounded-md border border-border">
            {candidatos.map((p) => (
              <li key={p.slug} className="flex items-center gap-2 px-3 py-2 text-sm">
                <span className="min-w-0 flex-1 truncate">
                  {p.nome}
                  <span className="ml-2 text-xs text-muted-foreground">
                    {p.marca ?? "sem marca"}
                  </span>
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => mover.mutate({ slugs: [p.slug], para: slug })}
                  disabled={mover.isPending}
                >
                  <Plus className="size-4" /> Adicionar
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

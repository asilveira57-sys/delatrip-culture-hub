import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, Eye, EyeOff, Plus, RotateCcw, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { listarCaminhosEditados } from "@/lib/paginas-admin";
import { produtosDaMarca, useMarcaOverlays } from "@/lib/marcas";
import { transferirProdutos, useMarcaDeProdutos } from "@/lib/marcas-produtos";
import { caminhoMarca } from "@/lib/marcas-core";
import {
  criarMarcaAdmin,
  excluirMarcaAdmin,
  listarMarcasAdmin,
  restaurarMarcaAdmin,
  salvarMarcaAdmin,
  slugify,
  type MarcaAdmin,
} from "@/lib/marcas-admin";

export const Route = createFileRoute("/admin/_gate/marcas/")({
  head: () => ({
    meta: [
      { title: "Marcas — Admin DeLaTrip" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: MarcasAdminPage,
});

type Filtro = "todas" | "editadas" | "padrao" | "ocultas" | "mescladas";

function MarcasAdminPage() {
  const [termo, setTermo] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [novoNome, setNovoNome] = useState("");
  const [criando, setCriando] = useState(false);
  const [excluir, setExcluir] = useState<MarcaAdmin | null>(null);
  const [destino, setDestino] = useState("");
  const qc = useQueryClient();
  const marcasOv = useMarcaOverlays();
  const produtoMarcas = useMarcaDeProdutos();
  const produtosDoExcluir = excluir
    ? produtosDaMarca(excluir.slug, marcasOv, produtoMarcas)
    : [];

  const { data: editadas } = useQuery({
    queryKey: ["admin", "paginas", "caminhos"],
    queryFn: listarCaminhosEditados,
    retry: false,
  });

  const { data: marcas = [], isLoading } = useQuery({
    queryKey: ["admin", "marcas"],
    queryFn: listarMarcasAdmin,
    retry: false,
  });

  function invalidar() {
    void qc.invalidateQueries({ queryKey: ["admin", "marcas"] });
    void qc.invalidateQueries({ queryKey: ["marca_overlay"] });
    void qc.invalidateQueries({ queryKey: ["produto_marca"] });
    void qc.invalidateQueries({ queryKey: ["produto_overlay"] });
  }

  const criar = useMutation({
    mutationFn: () => criarMarcaAdmin(novoNome),
    onSuccess: () => {
      toast.success("Marca criada.");
      setNovoNome("");
      setCriando(false);
      invalidar();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const alternarVisibilidade = useMutation({
    mutationFn: (m: MarcaAdmin) =>
      salvarMarcaAdmin({
        slug: m.slug,
        nome: m.nomeOriginal && m.nome === m.nomeOriginal ? null : m.nome,
        mesclarEm: m.mesclarEm,
        oculto: !m.oculto,
        manual: m.manual,
      }),
    onSuccess: (_d, m) => {
      toast.success(m.oculto ? "Marca exibida no site." : "Marca ocultada do site.");
      invalidar();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remover = useMutation({
    mutationFn: async (m: MarcaAdmin) => {
      const slugs = produtosDaMarca(m.slug, marcasOv, produtoMarcas).map((p) => p.slug);
      if (slugs.length) await transferirProdutos(slugs, destino.trim() || null);
      await excluirMarcaAdmin(m);
    },
    onSuccess: (_d, m) => {
      toast.success(m.manual ? "Marca excluída." : "Marca removida do site.");
      setExcluir(null);
      setDestino("");
      invalidar();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const restaurar = useMutation({
    mutationFn: (slug: string) => restaurarMarcaAdmin(slug),
    onSuccess: () => {
      toast.success("Marca restaurada ao padrão do catálogo.");
      invalidar();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const lista = useMemo(() => {
    const q = termo.trim().toLowerCase();
    return marcas
      .filter((m) => !q || m.nome.toLowerCase().includes(q) || m.slug.includes(q))
      .filter((m) => {
        if (filtro === "ocultas") return m.oculto;
        if (filtro === "mescladas") return !!m.mesclarEm;
        if (filtro === "todas") return true;
        const editada = editadas?.has(caminhoMarca(m.slug)) ?? false;
        return filtro === "editadas" ? editada : !editada;
      });
  }, [marcas, termo, filtro, editadas]);

  return (
    <div className="max-w-4xl pb-16">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Marcas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Cada marca tem uma página institucional em <code>/slug-da-marca</code>. Você pode
            renomear, incluir, ocultar/excluir e mesclar marcas duplicadas.
          </p>
        </div>
        <Button onClick={() => setCriando(true)}>
          <Plus className="size-4" /> Nova marca
        </Button>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative sm:max-w-xs sm:flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
            placeholder="Buscar marca"
            aria-label="Buscar marca"
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(["todas", "editadas", "padrao", "ocultas", "mescladas"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={
                filtro === f
                  ? "rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
                  : "rounded-md border border-border px-3 py-1.5 text-xs hover:bg-muted"
              }
            >
              {f === "todas"
                ? "Todas"
                : f === "editadas"
                  ? "Editadas"
                  : f === "padrao"
                    ? "Padrão"
                    : f === "ocultas"
                      ? "Ocultas"
                      : "Mescladas"}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        {isLoading ? "Carregando…" : `${lista.length} marca(s)`}
      </p>

      <ul className="mt-3 divide-y divide-border rounded-lg border border-border bg-card">
        {lista.map((m) => {
          const editada = editadas?.has(caminhoMarca(m.slug)) ?? false;
          const alterada = m.oculto || !!m.mesclarEm || m.manual || m.nome !== m.nomeOriginal;
          return (
            <li key={m.slug} className="flex items-center gap-2 pr-3">
              <Link
                to="/admin/marcas/$slug"
                params={{ slug: m.slug }}
                className="flex min-w-0 flex-1 items-center justify-between gap-3 px-4 py-3 hover:bg-muted"
              >
                <span className="min-w-0">
                  <span className="font-medium">{m.nome}</span>
                  <span className="ml-2 text-xs text-muted-foreground">/{m.slug}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    · {m.totalProdutos} produto(s)
                  </span>
                  {m.mesclarEm && (
                    <span className="ml-2 text-xs text-primary">→ mesclada em /{m.mesclarEm}</span>
                  )}
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  {m.manual && (
                    <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] uppercase text-primary">
                      nova
                    </span>
                  )}
                  {m.oculto && (
                    <span className="rounded bg-destructive/10 px-1.5 py-0.5 text-[10px] uppercase text-destructive">
                      oculta
                    </span>
                  )}
                  <span
                    className={
                      editada
                        ? "rounded bg-primary/10 px-1.5 py-0.5 text-[10px] uppercase text-primary"
                        : "rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground"
                    }
                  >
                    {editada ? "editada" : "padrão"}
                  </span>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </span>
              </Link>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  title={m.oculto ? "Exibir no site" : "Ocultar do site"}
                  aria-label={m.oculto ? `Exibir ${m.nome}` : `Ocultar ${m.nome}`}
                  onClick={() => alternarVisibilidade.mutate(m)}
                >
                  {m.oculto ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </Button>
                {alterada && !m.manual && (
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Restaurar padrão do catálogo"
                    aria-label={`Restaurar ${m.nome}`}
                    onClick={() => restaurar.mutate(m.slug)}
                  >
                    <RotateCcw className="size-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  title="Excluir marca"
                  aria-label={`Excluir ${m.nome}`}
                  onClick={() => setExcluir(m)}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            </li>
          );
        })}
      </ul>

      <Dialog open={criando} onOpenChange={setCriando}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova marca</DialogTitle>
            <DialogDescription>
              Cria uma marca que não existe no catálogo importado da loja. Ela ganha página
              institucional própria.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="nova-marca">Nome da marca</Label>
            <Input
              id="nova-marca"
              value={novoNome}
              onChange={(e) => setNovoNome(e.target.value)}
              placeholder="Ex.: Hippie Bong"
            />
            {novoNome.trim() && (
              <p className="text-xs text-muted-foreground">Endereço: /{slugify(novoNome)}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCriando(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => criar.mutate()}
              disabled={!novoNome.trim() || criar.isPending}
            >
              {criar.isPending ? "Criando…" : "Criar marca"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!excluir}
        onOpenChange={(v) => {
          if (!v) {
            setExcluir(null);
            setDestino("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir {excluir?.nome}?</DialogTitle>
            <DialogDescription>
              {excluir?.manual
                ? "A marca criada no admin será apagada, junto com sua página institucional."
                : "Marcas vindas do catálogo da loja não podem ser apagadas do arquivo de origem — ela será removida do site (oculta) e deixará de aparecer nas listagens e na busca."}
            </DialogDescription>
          </DialogHeader>
          {produtosDoExcluir.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="destino-produtos">
                {produtosDoExcluir.length} produto(s) nesta marca — transferir para
              </Label>
              <Input
                id="destino-produtos"
                list="marcas-destino-exclusao"
                value={destino}
                onChange={(e) => setDestino(e.target.value.trim())}
                placeholder="slug da marca de destino (vazio = sem marca)"
              />
              <datalist id="marcas-destino-exclusao">
                {marcas
                  .filter((m) => m.slug !== excluir?.slug)
                  .map((m) => (
                    <option key={m.slug} value={m.slug}>
                      {m.nome}
                    </option>
                  ))}
              </datalist>
              <p className="text-xs text-muted-foreground">
                Se deixar em branco, os produtos continuam no catálogo, porém sem marca.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setExcluir(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => excluir && remover.mutate(excluir)}
              disabled={remover.isPending}
            >
              {remover.isPending ? "Excluindo…" : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, MoreHorizontal, Pencil, RotateCcw, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { products, rootCategories, getCategoryById, rootOf } from "@/lib/catalog";
import {
  definirOcultoEmLote,
  definirRevisaoEmLote,
  listarOverlaysAdmin,
  reverterOverlay,
  statusOverlay,
  type StatusEnriquecimento,
} from "@/lib/produtos-admin";

export const Route = createFileRoute("/admin/_gate/produtos/")({
  head: () => ({
    meta: [
      { title: "Produtos — Admin DeLaTrip" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ProdutosAdminPage,
});

const STATUS: { id: StatusEnriquecimento | "todos"; label: string }[] = [
  { id: "todos", label: "Todos os textos" },
  { id: "original", label: "Só texto da Tray" },
  { id: "pendente", label: "Aguardando revisão" },
  { id: "aprovado", label: "Aprovados" },
  { id: "reprovado", label: "Reprovados" },
];

const CORES: Record<StatusEnriquecimento, string> = {
  original: "bg-muted text-muted-foreground",
  pendente: "bg-gold/20 text-gold",
  aprovado: "bg-primary/15 text-primary",
  reprovado: "bg-destructive/15 text-destructive",
};

const POR_PAGINA = 50;

function ProdutosAdminPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("todas");
  const [status, setStatus] = useState<StatusEnriquecimento | "todos">("todos");
  const [visibilidade, setVisibilidade] = useState("todos");
  const [pagina, setPagina] = useState(0);
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());

  const { data: overlays, isLoading } = useQuery({
    queryKey: ["admin", "overlays"],
    queryFn: listarOverlaysAdmin,
    retry: false,
  });

  const atualizar = () =>
    queryClient.invalidateQueries({ queryKey: ["admin", "overlays"] });

  const lote = useMutation({
    mutationFn: async (acao: "ocultar" | "exibir" | "aprovar" | "reprovar") => {
      const slugs = [...selecionados];
      if (acao === "ocultar" || acao === "exibir")
        await definirOcultoEmLote(slugs, acao === "ocultar");
      else await definirRevisaoEmLote(slugs, acao === "aprovar" ? "aprovado" : "reprovado");
      return slugs.length;
    },
    onSuccess: (n) => {
      toast.success(`${n} produto(s) atualizados.`);
      setSelecionados(new Set());
      void atualizar();
    },
    onError: () => toast.error("Não foi possível aplicar a ação em lote."),
  });

  const reverter = useMutation({
    mutationFn: (slug: string) => reverterOverlay(slug),
    onSuccess: () => {
      toast.success("Edição revertida — o site volta ao texto da Tray.");
      void atualizar();
    },
    onError: () => toast.error("Não foi possível reverter a edição."),
  });

  const ocultar = useMutation({
    mutationFn: ({ slug, oculto }: { slug: string; oculto: boolean }) =>
      definirOcultoEmLote([slug], oculto),
    onSuccess: (_, vars) => {
      toast.success(vars.oculto ? "Produto ocultado do site." : "Produto exibido no site.");
      void atualizar();
    },
    onError: () => toast.error("Não foi possível alterar a visibilidade."),
  });

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return products.filter((p) => {
      if (termo && !`${p.nome} ${p.marca ?? ""} ${p.slug}`.toLowerCase().includes(termo))
        return false;
      if (categoria !== "todas") {
        const cat = getCategoryById(p.categoriaId);
        if (!cat || rootOf(cat).slug !== categoria) return false;
      }
      const ov = overlays?.get(p.slug);
      if (status !== "todos" && statusOverlay(ov) !== status) return false;
      if (visibilidade === "ocultos" && !ov?.oculto) return false;
      if (visibilidade === "visiveis" && ov?.oculto) return false;
      return true;
    });
  }, [busca, categoria, status, visibilidade, overlays]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas - 1);
  const visiveis = filtrados.slice(
    paginaAtual * POR_PAGINA,
    paginaAtual * POR_PAGINA + POR_PAGINA,
  );

  function alternar(slug: string) {
    setSelecionados((atual) => {
      const novo = new Set(atual);
      if (novo.has(slug)) novo.delete(slug);
      else novo.add(slug);
      return novo;
    });
  }

  const todosDaPagina = visiveis.every((p) => selecionados.has(p.slug));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Produtos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Catálogo da Tray mesclado com a sobreposição editorial. O JSON nunca é
            alterado — tudo aqui é sobreposição por slug.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/admin/produtos/revisar">Revisar textos de IA</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/admin/produtos/enriquecer" search={{ slugs: "" }}>
              <Sparkles className="size-4" aria-hidden="true" />
              Enriquecer com IA
            </Link>
          </Button>
        </div>

      </div>

      <div className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          value={busca}
          onChange={(e) => {
            setBusca(e.target.value);
            setPagina(0);
          }}
          placeholder="Buscar por nome, marca ou slug"
        />
        <Select
          value={categoria}
          onValueChange={(v) => {
            setCategoria(v);
            setPagina(0);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as categorias</SelectItem>
            {rootCategories.map((c) => (
              <SelectItem key={c.id} value={c.slug}>
                {c.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v as StatusEnriquecimento | "todos");
            setPagina(0);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Texto" />
          </SelectTrigger>
          <SelectContent>
            {STATUS.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={visibilidade}
          onValueChange={(v) => {
            setVisibilidade(v);
            setPagina(0);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Visibilidade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Visíveis e ocultos</SelectItem>
            <SelectItem value="visiveis">Somente visíveis</SelectItem>
            <SelectItem value="ocultos">Somente ocultos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {selecionados.size > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-md border border-border bg-card p-3 text-sm">
          <span className="font-medium">{selecionados.size} selecionado(s)</span>
          <Button size="sm" variant="outline" onClick={() => lote.mutate("ocultar")}>
            <EyeOff className="size-4" aria-hidden="true" />
            Ocultar
          </Button>
          <Button size="sm" variant="outline" onClick={() => lote.mutate("exibir")}>
            <Eye className="size-4" aria-hidden="true" />
            Exibir
          </Button>
          <Button size="sm" variant="outline" onClick={() => lote.mutate("aprovar")}>
            Aprovar textos
          </Button>
          <Button size="sm" variant="outline" onClick={() => lote.mutate("reprovar")}>
            Reprovar textos
          </Button>
          <Button
            size="sm"
            onClick={() =>
              navigate({
                to: "/admin/produtos/enriquecer",
                search: { slugs: [...selecionados].join(",") },
              })
            }
          >
            <Sparkles className="size-4" aria-hidden="true" />
            Enriquecer selecionados
          </Button>
          <button
            className="ml-auto text-xs text-muted-foreground underline"
            onClick={() => setSelecionados(new Set())}
          >
            limpar seleção
          </button>
        </div>
      )}

      <p className="mt-4 text-xs text-muted-foreground">
        {isLoading ? "Carregando sobreposições…" : `${filtrados.length} produto(s)`}
      </p>

      <div className="mt-2 overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="w-10 p-3">
                <Checkbox
                  checked={visiveis.length > 0 && todosDaPagina}
                  onCheckedChange={(v) =>
                    setSelecionados((atual) => {
                      const novo = new Set(atual);
                      for (const p of visiveis) {
                        if (v) novo.add(p.slug);
                        else novo.delete(p.slug);
                      }
                      return novo;
                    })
                  }
                  aria-label="Selecionar página"
                />
              </th>
              <th className="p-3">Produto</th>
              <th className="p-3">Marca</th>
              <th className="p-3">Texto</th>
              <th className="p-3">Site</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {visiveis.map((p) => {
              const ov = overlays?.get(p.slug);
              const st = statusOverlay(ov);
              return (
                <tr key={p.slug} className="border-b border-border/60 last:border-0">
                  <td className="p-3">
                    <Checkbox
                      checked={selecionados.has(p.slug)}
                      onCheckedChange={() => alternar(p.slug)}
                      aria-label={`Selecionar ${p.nome}`}
                    />
                  </td>
                  <td className="p-3">
                    <Link
                      to="/admin/produtos/$slug"
                      params={{ slug: p.slug }}
                      className="font-medium hover:text-primary"
                    >
                      {p.nome}
                    </Link>
                    <p className="text-xs text-muted-foreground">{p.slug}</p>
                  </td>
                  <td className="p-3 text-muted-foreground">{p.marca ?? "—"}</td>
                  <td className="p-3">
                    <span className={`rounded px-2 py-0.5 text-xs ${CORES[st]}`}>
                      {STATUS.find((s) => s.id === st)?.label ?? st}
                    </span>
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {ov?.oculto ? "Oculto" : "Visível"}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button asChild size="sm" variant="ghost">
                        <Link to="/admin/produtos/$slug" params={{ slug: p.slug }}>
                          <Pencil className="size-4" aria-hidden="true" />
                          Editar
                        </Link>
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost" aria-label="Mais ações">
                            <MoreHorizontal className="size-4" aria-hidden="true" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => reverter.mutate(p.slug)}
                            disabled={reverter.isPending || st === "original"}
                          >
                            <RotateCcw className="mr-2 size-4" aria-hidden="true" />
                            Reverter edições
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              ocultar.mutate({ slug: p.slug, oculto: !ov?.oculto })
                            }
                            disabled={ocultar.isPending}
                          >
                            {ov?.oculto ? (
                              <>
                                <Eye className="mr-2 size-4" aria-hidden="true" />
                                Exibir no site
                              </>
                            ) : (
                              <>
                                <EyeOff className="mr-2 size-4" aria-hidden="true" />
                                Ocultar do site
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPaginas > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <Button
            variant="outline"
            size="sm"
            disabled={paginaAtual === 0}
            onClick={() => setPagina(paginaAtual - 1)}
          >
            Anterior
          </Button>
          <span className="text-muted-foreground">
            Página {paginaAtual + 1} de {totalPaginas}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={paginaAtual >= totalPaginas - 1}
            onClick={() => setPagina(paginaAtual + 1)}
          >
            Próxima
          </Button>
        </div>
      )}
    </div>
  );
}

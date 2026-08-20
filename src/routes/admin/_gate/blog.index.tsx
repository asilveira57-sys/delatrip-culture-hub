import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Heart, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  contarCurtidasPorPost,
  duplicarPost,
  excluirPost,
  importarPostsDoJson,
  listarPostsAdmin,
  statusDoPost,
  type PostAdmin,
  type StatusPost,
} from "@/lib/blog-admin";


export const Route = createFileRoute("/admin/_gate/blog/")({
  head: () => ({
    meta: [
      { title: "Blog — Admin DeLaTrip" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: BlogAdminPage,
});

const FILTROS = [
  { id: "todos", label: "Todos" },
  { id: "publicado", label: "Publicados" },
  { id: "rascunho", label: "Rascunhos" },
  { id: "agendado", label: "Agendados" },
] as const;

const CORES: Record<StatusPost, string> = {
  publicado: "bg-primary/15 text-primary",
  rascunho: "bg-muted text-muted-foreground",
  agendado: "bg-gold/20 text-gold",
};

function formatar(data: string | null) {
  if (!data) return "—";
  return new Date(data).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function BlogAdminPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filtro, setFiltro] = useState<(typeof FILTROS)[number]["id"]>("todos");
  const [categoria, setCategoria] = useState<string>("todas");
  const [busca, setBusca] = useState("");
  const [paraExcluir, setParaExcluir] = useState<PostAdmin | null>(null);


  const { data: posts, isLoading } = useQuery({
    queryKey: ["admin", "posts"],
    queryFn: listarPostsAdmin,
    retry: false,
  });
  const { data: curtidas } = useQuery({
    queryKey: ["admin", "curtidas-post"],
    queryFn: contarCurtidasPorPost,
    retry: false,
  });

  const atualizar = () => queryClient.invalidateQueries({ queryKey: ["admin", "posts"] });

  const importar = useMutation({
    mutationFn: importarPostsDoJson,
    onSuccess: (n) => {
      toast.success(`${n} posts importados do arquivo JSON.`);
      void atualizar();
    },
    onError: () => toast.error("Não foi possível importar os posts."),
  });

  const duplicar = useMutation({
    mutationFn: duplicarPost,
    onSuccess: () => {
      toast.success("Post duplicado como rascunho.");
      void atualizar();
    },
    onError: () => toast.error("Não foi possível duplicar."),
  });

  const remover = useMutation({
    mutationFn: excluirPost,
    onSuccess: () => {
      toast.success("Post excluído.");
      setParaExcluir(null);
      void atualizar();
    },
    onError: () => toast.error("Não foi possível excluir."),
  });

  const lista = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return (posts ?? []).filter((p) => {
      const status = statusDoPost(p);
      if (filtro !== "todos" && status !== filtro) return false;
      return !termo || p.titulo.toLowerCase().includes(termo);
    });
  }, [posts, filtro, busca]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Blog</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Posts publicados, rascunhos e agendamentos.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => importar.mutate()}
            disabled={importar.isPending}
          >
            {importar.isPending ? "Importando…" : "Importar do JSON"}
          </Button>
          <Button onClick={() => navigate({ to: "/admin/blog/$slug", params: { slug: "novo" } })}>
            <Plus className="size-4" /> Novo post
          </Button>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {FILTROS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFiltro(f.id)}
            className={
              filtro === f.id
                ? "rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground"
                : "rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:bg-muted"
            }
          >
            {f.label}
          </button>
        ))}
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por título"
          className="ml-auto w-56"
        />
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Título</th>
              <th className="px-3 py-2">Categoria</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Data</th>
              <th className="px-3 py-2">Curtidas</th>
              <th className="px-3 py-2 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">
                  Carregando…
                </td>
              </tr>
            ) : lista.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">
                  Nenhum post encontrado. Use “Importar do JSON” para trazer os textos atuais.
                </td>
              </tr>
            ) : (
              lista.map((p) => {
                const status = statusDoPost(p);
                return (
                  <tr key={p.slug} className="border-b border-border last:border-0">
                    <td className="px-3 py-2">
                      <Link
                        to="/admin/blog/$slug"
                        params={{ slug: p.slug }}
                        className="font-medium hover:text-primary"
                      >
                        {p.titulo}
                      </Link>
                      <p className="text-xs text-muted-foreground">/blog/{p.slug}</p>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{p.categoria ?? "—"}</td>
                    <td className="px-3 py-2">
                      <span className={`rounded px-2 py-0.5 text-xs ${CORES[status]}`}>
                        {status}
                      </span>
                    </td>
                    <td className="px-3 py-2 tabular-nums text-muted-foreground">
                      {formatar(p.publicado_em)}
                    </td>
                    <td className="px-3 py-2">
                      <span className="inline-flex items-center gap-1 tabular-nums text-muted-foreground">
                        <Heart className="size-3.5" /> {curtidas?.[p.slug] ?? 0}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex justify-end gap-1">
                        <Link
                          to="/admin/blog/$slug"
                          params={{ slug: p.slug }}
                          className="rounded p-1.5 hover:bg-muted"
                          title="Editar"
                        >
                          <Pencil className="size-4" />
                        </Link>
                        <button
                          onClick={() => duplicar.mutate(p)}
                          className="rounded p-1.5 hover:bg-muted"
                          title="Duplicar"
                        >
                          <Copy className="size-4" />
                        </button>
                        <button
                          onClick={() => setParaExcluir(p)}
                          className="rounded p-1.5 text-destructive hover:bg-muted"
                          title="Excluir"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <AlertDialog open={!!paraExcluir} onOpenChange={(v) => !v && setParaExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir post</AlertDialogTitle>
            <AlertDialogDescription>
              “{paraExcluir?.titulo}” será removido definitivamente. Links existentes para
              este endereço deixarão de funcionar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => paraExcluir && remover.mutate(paraExcluir.slug)}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, Pencil, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getProduct } from "@/lib/catalog";
import { textoPuro, verificarTexto } from "@/lib/enriquecer-core";
import {
  definirRevisaoEmLote,
  listarOverlaysAdmin,
  statusOverlay,
  type OverlayAdmin,
} from "@/lib/produtos-admin";
import { sanitizarHtml } from "@/lib/sanitize";

export const Route = createFileRoute("/admin/_gate/produtos/revisar")({
  head: () => ({
    meta: [
      { title: "Revisar textos de IA — Admin DeLaTrip" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: RevisarPage,
});

type Filtro = "pendente" | "reprovado" | "aprovado";

function RevisarPage() {
  const queryClient = useQueryClient();
  const [filtro, setFiltro] = useState<Filtro>("pendente");
  const [busca, setBusca] = useState("");
  const [salvando, setSalvando] = useState(false);

  const { data: overlays, isLoading } = useQuery({
    queryKey: ["admin", "overlays"],
    queryFn: listarOverlaysAdmin,
    retry: false,
  });

  const lista = useMemo(() => {
    const todos = [...(overlays?.values() ?? [])].filter(
      (o) => statusOverlay(o) === filtro,
    );
    const termo = busca.trim().toLowerCase();
    const comNome = todos.map((ov) => ({
      ov,
      nome: getProduct(ov.slug)?.nome ?? ov.slug,
    }));
    const filtrados = termo
      ? comNome.filter(
          (l) =>
            l.nome.toLowerCase().includes(termo) ||
            l.ov.slug.toLowerCase().includes(termo),
        )
      : comNome;
    return filtrados.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  }, [overlays, filtro, busca]);

  async function decidir(slugs: string[], status: "aprovado" | "reprovado") {
    if (slugs.length === 0) return;
    setSalvando(true);
    try {
      await definirRevisaoEmLote(slugs, status);
      await queryClient.invalidateQueries({ queryKey: ["admin", "overlays"] });
      await queryClient.invalidateQueries({ queryKey: ["produto_overlay"] });
      toast.success(
        status === "aprovado"
          ? `${slugs.length} texto(s) aprovado(s) e no ar.`
          : `${slugs.length} texto(s) reprovado(s) — o site segue com o texto da Tray.`,
      );
    } catch {
      toast.error("Não foi possível salvar a revisão.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div>
      <Button asChild size="sm" variant="ghost" className="-ml-2">
        <Link to="/admin/produtos">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Produtos
        </Link>
      </Button>
      <h1 className="mt-1 text-xl font-semibold">Revisar textos de IA</h1>
      <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
        Compare o texto de origem da Tray com o texto reescrito. Só o que for
        aprovado aqui aparece no site; reprovar mantém a descrição original.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Select value={filtro} onValueChange={(v) => setFiltro(v as Filtro)}>
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pendente">Aguardando revisão</SelectItem>
            <SelectItem value="reprovado">Reprovados</SelectItem>
            <SelectItem value="aprovado">Aprovados</SelectItem>
          </SelectContent>
        </Select>
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome ou slug"
          className="w-72"
        />
        <span className="text-sm text-muted-foreground">
          {lista.length} item(ns)
        </span>
        {filtro === "pendente" && lista.length > 0 && (
          <Button
            className="ml-auto"
            variant="outline"
            disabled={salvando}
            onClick={() =>
              void decidir(
                lista.filter((l) => semRessalvas(l.ov)).map((l) => l.ov.slug),
                "aprovado",
              )
            }
          >
            <Check className="size-4" aria-hidden="true" />
            Aprovar todos sem ressalva (
            {lista.filter((l) => semRessalvas(l.ov)).length})
          </Button>
        )}
      </div>

      {isLoading && (
        <p className="mt-8 text-sm text-muted-foreground">Carregando…</p>
      )}

      {!isLoading && lista.length === 0 && (
        <p className="mt-8 text-sm text-muted-foreground">
          Nenhum texto nesta situação.
        </p>
      )}

      <div className="mt-4 space-y-4">
        {lista.map(({ ov, nome }) => (
          <CartaoRevisao
            key={ov.slug}
            overlay={ov}
            nome={nome}
            salvando={salvando}
            onDecidir={(status) => void decidir([ov.slug], status)}
          />
        ))}
      </div>
    </div>
  );
}

function semRessalvas(ov: OverlayAdmin) {
  return (
    verificarTexto(ov.descricao_original ?? "", ov.descricao_html ?? "")
      .aprovado
  );
}

function CartaoRevisao({
  overlay,
  nome,
  salvando,
  onDecidir,
}: {
  overlay: OverlayAdmin;
  nome: string;
  salvando: boolean;
  onDecidir: (status: "aprovado" | "reprovado") => void;
}) {
  const verificacao = verificarTexto(
    overlay.descricao_original ?? "",
    overlay.descricao_html ?? "",
  );

  return (
    <article className="rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-medium">{nome}</h2>
          <p className="text-xs text-muted-foreground">
            {overlay.slug}
            {overlay.enriquecido_modelo ? ` · ${overlay.enriquecido_modelo}` : ""}
            {` · ${verificacao.caracteres} caracteres · aderência ${verificacao.similaridade}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild size="sm" variant="ghost">
            <Link to="/admin/produtos/$slug" params={{ slug: overlay.slug }}>
              <Pencil className="size-4" aria-hidden="true" />
              Editar
            </Link>
          </Button>
          {overlay.status_revisao !== "reprovado" && (
            <Button
              size="sm"
              variant="outline"
              disabled={salvando}
              onClick={() => onDecidir("reprovado")}
            >
              <X className="size-4" aria-hidden="true" />
              Reprovar
            </Button>
          )}
          {overlay.status_revisao !== "aprovado" && (
            <Button size="sm" disabled={salvando} onClick={() => onDecidir("aprovado")}>
              <Check className="size-4" aria-hidden="true" />
              Aprovar
            </Button>
          )}
        </div>
      </div>

      {verificacao.motivos.length > 0 && (
        <ul className="mt-3 list-disc space-y-0.5 rounded-md bg-muted p-3 pl-7 text-xs text-muted-foreground">
          {verificacao.motivos.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      )}

      <div className="mt-3 grid gap-4 md:grid-cols-2">
        <div>
          <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
            Origem (Tray)
          </p>
          <p className="max-h-64 overflow-auto whitespace-pre-wrap rounded-md border border-border p-3 text-sm text-muted-foreground">
            {textoPuro(overlay.descricao_original ?? "") || "Sem texto de origem"}
          </p>
        </div>
        <div>
          <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
            Texto reescrito
          </p>
          <div
            className="conteudo-rico max-h-64 overflow-auto rounded-md border border-border p-3 text-sm"
            dangerouslySetInnerHTML={{
              __html: sanitizarHtml(overlay.descricao_html ?? ""),
            }}
          />
        </div>
      </div>
    </article>
  );
}

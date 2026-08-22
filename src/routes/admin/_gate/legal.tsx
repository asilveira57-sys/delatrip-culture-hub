import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { toast } from "sonner";

import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DOCUMENTOS_LEGAIS,
  listarDocumentosAdmin,
  listarVersoesDocumento,
  salvarDocumentoAdmin,
  type DocumentoAdmin,
} from "@/lib/portal-admin";

export const Route = createFileRoute("/admin/_gate/legal")({
  head: () => ({
    meta: [
      { title: "Central legal — Admin DeLaTrip" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: LegalAdminPage,
});

function documentoVazio(chave: string, nome: string): DocumentoAdmin {
  return {
    chave,
    titulo: nome,
    conteudo_html: "",
    versao: "1.0",
    status: "rascunho",
    publicado_em: null,
    updated_at: null,
  };
}

function LegalAdminPage() {
  const [chave, setChave] = useState<string>(DOCUMENTOS_LEGAIS[0].chave);
  const [doc, setDoc] = useState<DocumentoAdmin>(
    documentoVazio(DOCUMENTOS_LEGAIS[0].chave, DOCUMENTOS_LEGAIS[0].nome),
  );
  const [salvando, setSalvando] = useState(false);

  const { data, refetch } = useQuery({
    queryKey: ["admin", "documentos-legais"],
    queryFn: listarDocumentosAdmin,
    retry: false,
  });

  const versoes = useQuery({
    queryKey: ["admin", "documentos-legais", "versoes", chave],
    queryFn: () => listarVersoesDocumento(chave),
    retry: false,
  });

  useEffect(() => {
    const meta = DOCUMENTOS_LEGAIS.find((d) => d.chave === chave)!;
    const salvo = (data ?? []).find((d) => d.chave === chave);
    setDoc(salvo ?? documentoVazio(meta.chave, meta.nome));
  }, [chave, data]);

  async function salvar(status: string) {
    setSalvando(true);
    try {
      await salvarDocumentoAdmin({ ...doc, status });
      toast.success(status === "publicado" ? "Documento publicado." : "Rascunho salvo.");
      await refetch();
      await versoes.refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao salvar.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl pb-16">
      <h1 className="text-xl font-semibold">Central legal</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Textos publicados aqui substituem o conteúdo padrão das páginas legais.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {DOCUMENTOS_LEGAIS.map((d) => (
          <button
            key={d.chave}
            onClick={() => setChave(d.chave)}
            className={
              "rounded-md border px-3 py-1.5 text-sm " +
              (d.chave === chave
                ? "border-primary bg-primary/10 font-medium"
                : "border-border hover:bg-muted")
            }
          >
            {d.nome}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Título</Label>
          <Input
            value={doc.titulo}
            onChange={(e) => setDoc((a) => ({ ...a, titulo: e.target.value }))}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Versão</Label>
          <Input
            value={doc.versao}
            onChange={(e) => setDoc((a) => ({ ...a, versao: e.target.value }))}
          />
        </div>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        Status atual: {doc.status === "publicado" ? "Publicado" : "Rascunho"}
        {doc.publicado_em
          ? ` · publicado em ${new Date(doc.publicado_em).toLocaleDateString("pt-BR")}`
          : ""}
        {doc.updated_at
          ? ` · atualizado em ${new Date(doc.updated_at).toLocaleDateString("pt-BR")}`
          : ""}
      </p>

      <div className="mt-4">
        <RichTextEditor
          valor={doc.conteudo_html}
          onChange={(html) => setDoc((a) => ({ ...a, conteudo_html: html }))}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => void salvar("rascunho")} disabled={salvando}>
          <Save className="size-4" /> Salvar rascunho
        </Button>
        <Button onClick={() => void salvar("publicado")} disabled={salvando}>
          Publicar
        </Button>
      </div>

      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Histórico de versões
        </h2>
        <ul className="mt-3 divide-y divide-border rounded-lg border border-border bg-card text-sm">
          {(versoes.data ?? []).length === 0 ? (
            <li className="px-4 py-3 text-muted-foreground">Nenhuma versão salva ainda.</li>
          ) : (
            (versoes.data ?? []).map((v) => (
              <li key={v.id as string} className="flex justify-between px-4 py-2">
                <span>Versão {v.versao as string}</span>
                <span className="text-muted-foreground">
                  {new Date(v.created_at as string).toLocaleString("pt-BR")}
                </span>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}

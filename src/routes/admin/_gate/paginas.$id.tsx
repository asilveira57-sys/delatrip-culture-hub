import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { toast } from "sonner";

import { BotaoSeoIa } from "@/components/admin/BotaoSeoIa";
import { GoogleSnippetPreview } from "@/components/admin/GoogleSnippetPreview";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { paginaPorId } from "@/config/paginas-editaveis";
import {
  carregarPaginaAdmin,
  salvarPaginaAdmin,
  type SeoRotaAdmin,
} from "@/lib/paginas-admin";
import { SITE_URL } from "@/lib/seo";
import type { Blocos, JsonValor } from "@/lib/paginas-core";

export const Route = createFileRoute("/admin/_gate/paginas/$id")({
  head: () => ({
    meta: [
      { title: "Editar página — Admin DeLaTrip" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: EditarPaginaPage,
});

function Contador({ texto, limite }: { texto: string; limite: number }) {
  return (
    <span
      className={
        texto.length > limite
          ? "text-xs font-medium text-destructive"
          : "text-xs text-muted-foreground"
      }
    >
      {texto.length}/{limite}
    </span>
  );
}

function EditarPaginaPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const pagina = paginaPorId(id);

  const [blocos, setBlocos] = useState<Blocos>({});
  const [seo, setSeo] = useState<SeoRotaAdmin>({
    caminho: pagina?.caminho ?? "/",
    titulo: "",
    descricao: "",
    keywords: "",
    noindex: false,
  });
  const [salvando, setSalvando] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "pagina", pagina?.caminho],
    queryFn: () => carregarPaginaAdmin(pagina!.caminho),
    enabled: !!pagina,
    retry: false,
  });

  useEffect(() => {
    if (data) {
      setBlocos(data.blocos);
      setSeo(data.seo);
    }
  }, [data]);

  if (!pagina) {
    return <p className="text-sm text-muted-foreground">Página não encontrada.</p>;
  }
  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando…</p>;
  }

  function definir(chave: string, valor: JsonValor) {
    setBlocos((atual) => ({ ...atual, [chave]: valor }));
  }

  function itensLista(chave: string, quantidade: number, campos: { chave: string }[]) {
    const bruto = blocos[chave];
    const atual = Array.isArray(bruto) ? (bruto as Record<string, JsonValor>[]) : [];
    return Array.from({ length: quantidade }, (_, i) => {
      const item = atual[i] ?? {};
      const preenchido: Record<string, string> = {};
      for (const campo of campos) preenchido[campo.chave] = String(item[campo.chave] ?? "");
      return preenchido;
    });
  }

  async function salvar() {
    setSalvando(true);
    try {
      await salvarPaginaAdmin(pagina!.caminho, blocos, seo);
      toast.success("Página salva.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao salvar.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl pb-16">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">{pagina.nome}</h1>
          <p className="text-sm text-muted-foreground">{pagina.caminho}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate({ to: "/admin/paginas" })}>
            Voltar
          </Button>
          <Button onClick={() => void salvar()} disabled={salvando}>
            <Save className="size-4" /> {salvando ? "Salvando…" : "Salvar"}
          </Button>
        </div>
      </div>

      <div className="mt-6 space-y-5">
        {pagina.campos.map((campo) => {
          const valor = blocos[campo.chave];
          if (campo.tipo === "lista") {
            const campos = campo.itens ?? [];
            const itens = itensLista(campo.chave, campo.quantidade ?? 4, campos);
            return (
              <section key={campo.chave} className="rounded-lg border border-border bg-card p-4">
                <h2 className="text-sm font-semibold uppercase">{campo.label}</h2>
                {campo.ajuda ? (
                  <p className="mt-1 text-xs text-muted-foreground">{campo.ajuda}</p>
                ) : null}
                <div className="mt-3 space-y-3">
                  {itens.map((item, i) => (
                    <div key={i} className="grid gap-2 sm:grid-cols-2">
                      {campos.map((sub) => (
                        <div key={sub.chave}>
                          <Label>{`${sub.label} ${i + 1}`}</Label>
                          <Input
                            value={item[sub.chave] ?? ""}
                            onChange={(e) => {
                              const copia = itens.map((x) => ({ ...x }));
                              copia[i]![sub.chave] = e.target.value;
                              definir(campo.chave, copia as unknown as JsonValor);
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </section>
            );
          }

          if (campo.tipo === "rich") {
            return (
              <div key={campo.chave}>
                <Label>{campo.label}</Label>
                <RichTextEditor
                  valor={typeof valor === "string" ? valor : ""}
                  onChange={(html) => definir(campo.chave, html)}
                  baseArquivo={pagina.id}
                  minAltura="16rem"
                />
              </div>
            );
          }

          if (campo.tipo === "textarea") {
            return (
              <div key={campo.chave}>
                <Label htmlFor={campo.chave}>{campo.label}</Label>
                <Textarea
                  id={campo.chave}
                  rows={3}
                  value={typeof valor === "string" ? valor : ""}
                  onChange={(e) => definir(campo.chave, e.target.value)}
                />
              </div>
            );
          }

          return (
            <div key={campo.chave}>
              <Label htmlFor={campo.chave}>{campo.label}</Label>
              <Input
                id={campo.chave}
                value={typeof valor === "string" ? valor : ""}
                onChange={(e) => definir(campo.chave, e.target.value)}
              />
            </div>
          );
        })}

        <section className="rounded-lg border border-border bg-card p-4">
          <h2 className="text-sm font-semibold uppercase">SEO da página</h2>
          <div className="mt-3">
            <BotaoSeoIa
              tipo="pagina"
              titulo={pagina.nome}
              contexto={Object.values(blocos)
                .map((v) => (typeof v === "string" ? v : JSON.stringify(v)))
                .join("\n")}
              extra={`Endereço: ${pagina.caminho}`}
              vazio={!seo.titulo.trim() && !seo.descricao.trim() && !seo.keywords.trim()}
              onGerado={(gerado) =>
                setSeo((atual) => ({
                  ...atual,
                  titulo: gerado.titulo,
                  descricao: gerado.descricao,
                  keywords: gerado.keywords,
                }))
              }
            />
          </div>
          <div className="mt-3 space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="seo-titulo">Título SEO</Label>
                <Contador texto={seo.titulo} limite={60} />
              </div>
              <Input
                id="seo-titulo"
                value={seo.titulo}
                onChange={(e) => setSeo({ ...seo, titulo: e.target.value })}
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="seo-descricao">Descrição SEO</Label>
                <Contador texto={seo.descricao} limite={155} />
              </div>
              <Textarea
                id="seo-descricao"
                rows={2}
                value={seo.descricao}
                onChange={(e) => setSeo({ ...seo, descricao: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="seo-keywords">Palavras-chave</Label>
              <Input
                id="seo-keywords"
                value={seo.keywords}
                onChange={(e) => setSeo({ ...seo, keywords: e.target.value })}
                placeholder="termo um, termo dois, termo três"
              />
            </div>
            <GoogleSnippetPreview
              url={`${SITE_URL}${pagina.caminho}`}
              titulo={seo.titulo}
              descricao={seo.descricao}
              fallbackTitulo={pagina.nome}
            />
            <label className="flex items-center justify-between text-sm">
              Não indexar esta página (noindex)
              <Switch
                checked={seo.noindex}
                onCheckedChange={(v) => setSeo({ ...seo, noindex: v })}
              />
            </label>
          </div>
        </section>
      </div>
    </div>
  );
}

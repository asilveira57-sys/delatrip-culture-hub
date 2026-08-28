import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Save } from "lucide-react";
import { toast } from "sonner";

import { BotaoSeoIa } from "@/components/admin/BotaoSeoIa";
import { CamposBlocos } from "@/components/admin/CamposBlocos";
import { ProdutosDaMarca } from "@/components/admin/ProdutosDaMarca";
import { FaqEditor } from "@/components/admin/FaqEditor";
import { GoogleSnippetPreview } from "@/components/admin/GoogleSnippetPreview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { CAMPOS_MARCA, caminhoMarca } from "@/lib/marcas-core";
import { listarMarcasAdmin, salvarMarcaAdmin } from "@/lib/marcas-admin";
import {
  carregarPaginaAdmin,
  salvarPaginaAdmin,
  type SeoRotaAdmin,
} from "@/lib/paginas-admin";
import { SITE_URL } from "@/lib/seo";
import type { Blocos, JsonValor } from "@/lib/paginas-core";

export const Route = createFileRoute("/admin/_gate/marcas/$slug")({
  head: () => ({
    meta: [
      { title: "Editar marca — Admin DeLaTrip" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: EditarMarcaPage,
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

function EditarMarcaPage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const caminho = caminhoMarca(slug);

  const { data: marcas, isLoading: carregandoMarcas } = useQuery({
    queryKey: ["admin", "marcas"],
    queryFn: listarMarcasAdmin,
    retry: false,
  });
  const marca = marcas?.find((m) => m.slug === slug);

  const [nome, setNome] = useState("");
  const [mesclarEm, setMesclarEm] = useState("");
  const [oculto, setOculto] = useState(false);
  const [blocos, setBlocos] = useState<Blocos>({});
  const [seo, setSeo] = useState<SeoRotaAdmin>({
    caminho,
    titulo: "",
    descricao: "",
    keywords: "",
    noindex: false,
  });
  const [salvando, setSalvando] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "pagina", caminho],
    queryFn: () => carregarPaginaAdmin(caminho),
    retry: false,
  });

  useEffect(() => {
    if (data) {
      setBlocos(data.blocos);
      setSeo(data.seo);
    }
  }, [data]);

  useEffect(() => {
    if (marca) {
      setNome(marca.nome);
      setMesclarEm(marca.mesclarEm ?? "");
      setOculto(marca.oculto);
    }
  }, [marca]);

  if (isLoading || carregandoMarcas) {
    return <p className="text-sm text-muted-foreground">Carregando…</p>;
  }
  if (!marca) {
    return <p className="text-sm text-muted-foreground">Marca não encontrada.</p>;
  }

  function definir(chave: string, valor: JsonValor) {
    setBlocos((atual) => ({ ...atual, [chave]: valor }));
  }

  async function salvar() {
    if (!marca) return;
    setSalvando(true);
    try {
      await salvarMarcaAdmin({
        slug,
        nome: nome.trim() && nome.trim() !== marca.nomeOriginal ? nome.trim() : null,
        mesclarEm: mesclarEm === slug ? null : mesclarEm,
        oculto,
        manual: marca.manual,
      });
      await salvarPaginaAdmin(caminho, blocos, seo);
      void qc.invalidateQueries({ queryKey: ["admin", "marcas"] });
      void qc.invalidateQueries({ queryKey: ["marca_overlay"] });
      toast.success("Marca salva.");
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
          <h1 className="text-xl font-semibold">{marca.nome}</h1>
          <p className="text-sm text-muted-foreground">
            {caminho} · {marca.totalProdutos} produto(s) no catálogo
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <a href={caminho} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-4" /> Ver página
            </a>
          </Button>
          <Button variant="outline" onClick={() => navigate({ to: "/admin/marcas" })}>
            Voltar
          </Button>
          <Button onClick={() => void salvar()} disabled={salvando}>
            <Save className="size-4" /> {salvando ? "Salvando…" : "Salvar"}
          </Button>
        </div>
      </div>

      <div className="mt-6 space-y-5">
        <section className="rounded-lg border border-border bg-card p-4">
          <h2 className="text-sm font-semibold uppercase">Dados da marca</h2>
          <div className="mt-3 space-y-3">
            <div>
              <Label htmlFor="marca-nome">Nome exibido</Label>
              <Input
                id="marca-nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder={marca.nomeOriginal ?? marca.slug}
              />
              {marca.nomeOriginal && marca.nomeOriginal !== nome.trim() && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Nome original do catálogo: {marca.nomeOriginal}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="marca-mesclar">Mesclar em (marca duplicada)</Label>
              <Input
                id="marca-mesclar"
                list="marcas-disponiveis"
                value={mesclarEm}
                onChange={(e) => setMesclarEm(e.target.value.trim())}
                placeholder="slug da marca principal — ex.: hippie-bong"
              />
              <datalist id="marcas-disponiveis">
                {(marcas ?? [])
                  .filter((m) => m.slug !== slug)
                  .map((m) => (
                    <option key={m.slug} value={m.slug}>
                      {m.nome}
                    </option>
                  ))}
              </datalist>
              <p className="mt-1 text-xs text-muted-foreground">
                Ao mesclar, esta marca some das listagens e seus produtos passam a aparecer na
                marca principal. Deixe em branco para não mesclar.
              </p>
            </div>

            <label className="flex items-center justify-between text-sm">
              Ocultar esta marca do site
              <Switch checked={oculto} onCheckedChange={setOculto} />
            </label>
          </div>
        </section>

        <ProdutosDaMarca slug={slug} marcas={marcas ?? []} />

        <CamposBlocos
          campos={CAMPOS_MARCA}
          blocos={blocos}
          onChange={definir}
          baseArquivo={`marcas/${slug}`}
        />

        <FaqEditor
          tipo="marca"
          alvo={slug}
          titulo={
            (typeof blocos["headline"] === "string" && blocos["headline"].trim()) || marca.nome
          }
          contexto={Object.values(blocos)
            .map((v) => (typeof v === "string" ? v : JSON.stringify(v)))
            .join("\n")}
          extra={`Página institucional da marca ${marca.nome}`}
        />

        <section className="rounded-lg border border-border bg-card p-4">
          <h2 className="text-sm font-semibold uppercase">SEO da página</h2>
          <div className="mt-3">
            <BotaoSeoIa
              tipo="pagina"
              titulo={
                (typeof blocos["headline"] === "string" && blocos["headline"].trim()) ||
                marca.nome
              }
              contexto={Object.values(blocos)
                .map((v) => (typeof v === "string" ? v : JSON.stringify(v)))
                .join("\n")}
              extra={`Página institucional da marca ${marca.nome} em ${caminho}`}
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
              url={`${SITE_URL}${caminho}`}
              titulo={seo.titulo}
              descricao={seo.descricao}
              keywords={seo.keywords}
              fallbackTitulo={marca.nome}
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

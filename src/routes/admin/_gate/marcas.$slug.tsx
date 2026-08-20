import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Save } from "lucide-react";
import { toast } from "sonner";

import { BotaoSeoIa } from "@/components/admin/BotaoSeoIa";
import { CamposBlocos } from "@/components/admin/CamposBlocos";
import { FaqEditor } from "@/components/admin/FaqEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import brandsJson from "@/data/brands.json";
import { CAMPOS_MARCA, caminhoMarca } from "@/lib/marcas-core";
import {
  carregarPaginaAdmin,
  salvarPaginaAdmin,
  type SeoRotaAdmin,
} from "@/lib/paginas-admin";
import type { Blocos, JsonValor } from "@/lib/paginas-core";

type MarcaJson = { nome: string; slug: string; totalProdutos: number };

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
  const marca = (brandsJson as MarcaJson[]).find((m) => m.slug === slug);
  const caminho = caminhoMarca(slug);

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
    enabled: !!marca,
    retry: false,
  });

  useEffect(() => {
    if (data) {
      setBlocos(data.blocos);
      setSeo(data.seo);
    }
  }, [data]);

  if (!marca) {
    return <p className="text-sm text-muted-foreground">Marca não encontrada.</p>;
  }
  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando…</p>;
  }

  function definir(chave: string, valor: JsonValor) {
    setBlocos((atual) => ({ ...atual, [chave]: valor }));
  }

  async function salvar() {
    setSalvando(true);
    try {
      await salvarPaginaAdmin(caminho, blocos, seo);
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

import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Download, ExternalLink, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { GoogleSnippetPreview } from "@/components/admin/GoogleSnippetPreview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { brands, categories, posts, products } from "@/lib/catalog";
import { SITE_URL } from "@/lib/seo";
import { gerarSeoIa } from "@/lib/seo-ia.functions";

export const Route = createFileRoute("/admin/_gate/seo")({
  head: () => ({
    meta: [
      { title: "SEO — Admin DeLaTrip" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: SeoPage,
});

/**
 * Rotas institucionais com um resumo do que cada página mostra. O resumo é o
 * contexto enviado à IA — ela só reescreve o que está aqui, sem inventar fato.
 */
const ROTAS = [
  {
    caminho: "/",
    nome: "Home",
    contexto:
      "Página inicial do portal institucional DeLaTrip, head shop brasileira do Rio de Janeiro. Apresenta a marca, as categorias do catálogo de acessórios, as marcas parceiras e os conteúdos editoriais do blog. Não é loja: não há carrinho nem checkout.",
  },
  {
    caminho: "/catalogo",
    nome: "Catálogo",
    contexto:
      "Catálogo de acessórios da DeLaTrip organizado por categorias e marcas, com busca e filtros. Cada produto tem página própria com ficha técnica e imagens. Vitrine institucional, sem venda direta no site.",
  },
  {
    caminho: "/marcas",
    nome: "Marcas",
    contexto:
      "Lista das marcas de acessórios representadas pela DeLaTrip, cada uma com página institucional própria e os produtos relacionados do catálogo.",
  },
  {
    caminho: "/acessorios",
    nome: "Acessórios",
    contexto:
      "Seleção de acessórios do catálogo DeLaTrip: bandejas, dichavadores, sedas, pipas de vidro e utensílios de coleção, agrupados por categoria.",
  },
  {
    caminho: "/blog",
    nome: "Blog",
    contexto:
      "Blog editorial da DeLaTrip com notícias, novidades de marcas, cultura, curadoria e conteúdos sobre legislação do setor de acessórios no Brasil.",
  },
  {
    caminho: "/sobre",
    nome: "Sobre",
    contexto:
      "Página institucional sobre a DeLaTrip: história, curadoria de marcas, atuação a partir do Rio de Janeiro (RJ) e proposta de portal de conteúdo e catálogo.",
  },
  {
    caminho: "/contato",
    nome: "Contato",
    contexto:
      "Página de contato da DeLaTrip com formulário, telefone, e-mail e dados da empresa no Rio de Janeiro (RJ), para dúvidas sobre marcas, catálogo e imprensa.",
  },
  {
    caminho: "/faq",
    nome: "FAQ",
    contexto:
      "Perguntas frequentes da DeLaTrip sobre o catálogo, marcas, atendimento, política de privacidade e o fato de o site ser institucional e não uma loja online.",
  },
] as const;

type Tracking = { id: string; ativo: boolean };
type RotaSeo = {
  caminho: string;
  titulo: string;
  descricao: string;
  keywords: string;
  noindex: boolean;
};

function trackingDe(valor: unknown): Tracking {
  if (valor && typeof valor === "object") {
    const v = valor as Record<string, unknown>;
    return { id: String(v["id"] ?? ""), ativo: v["ativo"] === true };
  }
  return { id: "", ativo: false };
}

async function carregar() {
  const [config, rotas, overlays] = await Promise.all([
    supabase.from("config_site").select("chave, valor"),
    supabase
      .from("seo_rota")
      .select("caminho, titulo, descricao, seo_keywords, noindex"),
    supabase.from("produto_overlay").select("slug, oculto"),
  ]);
  const mapa = new Map((config.data ?? []).map((r) => [r.chave, r.valor as unknown]));
  const rotasMapa = new Map((rotas.data ?? []).map((r) => [r.caminho, r]));
  return {
    ga4: trackingDe(mapa.get("ga4_id")),
    pixel: trackingDe(mapa.get("meta_pixel_id")),
    gtm: trackingDe(mapa.get("gtm_id")),
    modoConstrucao: mapa.get("modo_construcao") !== false,
    sitemapGeradoEm: (mapa.get("sitemap_gerado_em") as string | null) ?? null,
    rotas: ROTAS.map<RotaSeo>(({ caminho }) => {
      const r = rotasMapa.get(caminho);
      return {
        caminho,
        titulo: r?.titulo ?? "",
        descricao: r?.descricao ?? "",
        keywords: r?.seo_keywords ?? "",
        noindex: r?.noindex ?? false,
      };
    }),

    ocultos: new Set(
      (overlays.data ?? []).filter((o) => o.oculto).map((o) => o.slug as string),
    ),
  };
}

async function salvarConfig(chave: string, valor: unknown) {
  const { error } = await supabase
    .from("config_site")
    .upsert({ chave, valor: valor as never }, { onConflict: "chave" });
  if (error) throw error;
}

function Contador({ texto, limite }: { texto: string; limite: number }) {
  const excedeu = texto.length > limite;
  return (
    <span
      className={
        excedeu ? "text-xs font-medium text-destructive" : "text-xs text-muted-foreground"
      }
    >
      {texto.length}/{limite}
    </span>
  );
}

function Bloco({
  titulo,
  descricao,
  children,
}: {
  titulo: string;
  descricao?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <h2 className="text-base font-semibold">{titulo}</h2>
      {descricao ? (
        <p className="mt-1 text-sm text-muted-foreground">{descricao}</p>
      ) : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function CampoTracking({
  rotulo,
  valor,
  onChange,
  aviso,
}: {
  rotulo: string;
  valor: Tracking;
  onChange: (v: Tracking) => void;
  aviso?: string;
}) {
  return (
    <div className="grid gap-2 border-b border-border py-3 last:border-0 sm:grid-cols-[1fr_auto] sm:items-center">
      <div className="space-y-2">
        <Label>{rotulo}</Label>
        <Input
          value={valor.id}
          placeholder="ID"
          onChange={(e) => onChange({ ...valor, id: e.target.value })}
        />
        {aviso ? <p className="text-xs text-amber-600">{aviso}</p> : null}
      </div>
      <div className="flex items-center gap-2 sm:pl-6">
        <Switch
          checked={valor.ativo}
          onCheckedChange={(ativo) => onChange({ ...valor, ativo })}
        />
        <span className="text-sm text-muted-foreground">
          {valor.ativo ? "Ativo" : "Inativo"}
        </span>
      </div>
    </div>
  );
}

function SeoPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "seo"],
    queryFn: carregar,
    retry: false,
  });

  const [ga4, setGa4] = useState<Tracking>({ id: "", ativo: false });
  const [pixel, setPixel] = useState<Tracking>({ id: "", ativo: false });
  const [gtm, setGtm] = useState<Tracking>({ id: "", ativo: false });
  const [modo, setModo] = useState(true);
  const [rotas, setRotas] = useState<RotaSeo[]>([]);
  const [gerando, setGerando] = useState<string[]>([]);
  const [lote, setLote] = useState(false);
  const gerarSeo = useServerFn(gerarSeoIa);
  const [sitemapEm, setSitemapEm] = useState<string | null>(null);
  type Validacao = {
    status: number;
    urls: number;
    xmlOk: boolean;
    quando: string;
  };
  const [validacao, setValidacao] = useState<Validacao | null>(null);
  const [validando, setValidando] = useState(false);

  useEffect(() => {
    if (!data) return;
    setGa4(data.ga4);
    setPixel(data.pixel);
    setGtm(data.gtm);
    setModo(data.modoConstrucao);
    setRotas(data.rotas);
    setSitemapEm(data.sitemapGeradoEm);
  }, [data]);

  const urlsSitemap = useMemo(() => {
    const ocultos = data?.ocultos ?? new Set<string>();
    const rotasIndexaveis = rotas.filter((r) => !r.noindex).length || ROTAS.length;
    return (
      rotasIndexaveis +
      categories.length +
      brands.length +
      products.filter((p) => !ocultos.has(p.slug)).length +
      posts.length
    );
  }, [data, rotas]);

  async function salvarRastreamento() {
    try {
      await Promise.all([
        salvarConfig("ga4_id", ga4),
        salvarConfig("meta_pixel_id", pixel),
        salvarConfig("gtm_id", gtm),
      ]);
      toast.success("Rastreamento salvo.");
      queryClient.invalidateQueries({ queryKey: ["admin", "seo"] });
    } catch {
      toast.error("Não foi possível salvar.");
    }
  }

  async function alternarModo(valor: boolean) {
    setModo(valor);
    try {
      await salvarConfig("modo_construcao", valor);
      toast.success(valor ? "Modo construção ligado." : "Modo construção desligado.");
    } catch {
      setModo(!valor);
      toast.error("Não foi possível salvar.");
    }
  }

  /** Gera título, descrição e keywords de uma rota a partir do resumo dela. */
  async function gerarRota(indice: number, silencioso = false) {
    const meta = ROTAS[indice];
    if (!meta) return false;
    setGerando((s) => [...s, meta.caminho]);
    try {
      const r = await gerarSeo({
        data: {
          tipo: "pagina",
          titulo: `${meta.nome} — DeLaTrip`,
          contexto: meta.contexto,
          extra: `Rota do site: ${meta.caminho}`,
        },
      });
      if (!r.ok) {
        if (!silencioso) toast.error(r.erro ?? "Falha ao gerar o SEO.");
        return false;
      }
      setRotas((lista) =>
        lista.map((item, j) =>
          j === indice
            ? {
                ...item,
                titulo: r.titulo,
                descricao: r.descricao,
                keywords: r.keywords,
              }
            : item,
        ),
      );
      if (!silencioso) toast.success("SEO gerado. Revise e salve.");
      return true;
    } finally {
      setGerando((s) => s.filter((c) => c !== meta.caminho));
    }
  }

  /** Preenche todas as rotas ainda sem título/descrição, uma por vez. */
  async function gerarVazias() {
    const pendentes = rotas
      .map((r, i) => ({ r, i }))
      .filter(({ r }) => !r.titulo.trim() || !r.descricao.trim());
    if (pendentes.length === 0) {
      toast.info("Todas as páginas já têm título e descrição.");
      return;
    }
    setLote(true);
    let feitas = 0;
    try {
      for (const { i } of pendentes) {
        if (await gerarRota(i, true)) feitas += 1;
      }
      if (feitas === 0) toast.error("Não foi possível gerar as metas.");
      else toast.success(`${feitas} página(s) preenchida(s) pela IA. Revise e salve.`);
    } finally {
      setLote(false);
    }
  }

  async function salvarRotas() {
    try {
      const { error } = await supabase.from("seo_rota").upsert(
        rotas.map((r) => ({
          caminho: r.caminho,
          titulo: r.titulo || null,
          descricao: r.descricao || null,
          seo_keywords: r.keywords || null,
          noindex: r.noindex,
        })),
        { onConflict: "caminho" },
      );
      if (error) throw error;
      toast.success("Metas das páginas salvas.");

    } catch {
      toast.error("Não foi possível salvar.");
    }
  }

  /** URL pública do sitemap, baseada na origem em que o admin está aberto. */
  const sitemapUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/sitemap.xml`
      : `${SITE_URL}/sitemap.xml`;

  async function copiarSitemap() {
    try {
      await navigator.clipboard.writeText(sitemapUrl);
      toast.success("Endereço do sitemap copiado.");
    } catch {
      toast.error("Não foi possível copiar.");
    }
  }

  async function baixarSitemap() {
    try {
      const resposta = await fetch("/sitemap.xml", { cache: "reload" });
      if (!resposta.ok) throw new Error();
      const blob = new Blob([await resposta.text()], {
        type: "application/xml",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "sitemap.xml";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Não foi possível baixar o sitemap.");
    }
  }

  async function regerarSitemap() {
    try {
      const agora = new Date().toISOString();
      await salvarConfig("sitemap_gerado_em", agora);
      setSitemapEm(agora);
      await fetch("/sitemap.xml", { cache: "reload" });
      toast.success(`Sitemap regerado com ${urlsSitemap} URLs.`);
    } catch {
      toast.error("Não foi possível regerar.");
    }
  }

  /** Busca o sitemap real e valida status HTTP, formato XML e nº de URLs. */
  async function validarSitemap() {
    setValidando(true);
    try {
      const resposta = await fetch("/sitemap.xml", { cache: "reload" });
      const texto = await resposta.text();
      const xmlOk = texto.includes("<urlset");
      const urls = (texto.match(/<url>/g) ?? []).length;
      setValidacao({
        status: resposta.status,
        urls,
        xmlOk,
        quando: new Date().toLocaleString("pt-BR"),
      });
      if (resposta.ok && xmlOk) toast.success(`Sitemap válido com ${urls} URLs.`);
      else toast.error("Sitemap com problema — veja o resultado abaixo.");
    } catch {
      setValidacao(null);
      toast.error("Não foi possível acessar o sitemap.");
    } finally {
      setValidando(false);
    }
  }


  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando…</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">SEO</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Rastreamento, indexação, metas das páginas e sitemap.
        </p>
      </div>

      <Bloco
        titulo="A · Rastreamento"
        descricao="Os scripts só são injetados depois do aceite no banner de cookies. Antes do consentimento, nada carrega."
      >
        <CampoTracking rotulo="Google Analytics 4" valor={ga4} onChange={setGa4} />
        <CampoTracking rotulo="Google Tag Manager" valor={gtm} onChange={setGtm} />
        <CampoTracking
          rotulo="Meta Pixel"
          valor={pixel}
          onChange={setPixel}
          aviso="A política da Meta proíbe anúncios de tabaco e acessórios. Ative apenas se souber o uso pretendido."
        />
        <Button className="mt-4" onClick={salvarRastreamento}>
          Salvar rastreamento
        </Button>
      </Bloco>

      <Bloco titulo="B · Modo construção">
        <div className="flex items-center gap-3">
          <Switch checked={modo} onCheckedChange={alternarModo} />
          <span className="text-sm">
            Site em construção — {modo ? "ligado" : "desligado"}
          </span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Impede que o domínio de teste seja indexado antes da publicação no domínio
          definitivo. Com o modo ligado, todas as páginas públicas recebem
          <code className="mx-1">noindex, nofollow</code> e o robots.txt bloqueia tudo.
        </p>
      </Bloco>

      <Bloco
        titulo="C · Meta das páginas"
        descricao="A IA escreve título, descrição e palavras-chave a partir do conteúdo de cada página. Revise antes de salvar."
      >
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void gerarVazias()}
            disabled={lote}
          >
            <Sparkles className="size-4" />
            {lote ? "Gerando…" : "Gerar com IA as páginas vazias"}
          </Button>
          <span className="text-xs text-muted-foreground">
            Só preenche páginas sem título ou sem descrição.
          </span>
        </div>
        <div className="space-y-4">
          {rotas.map((rota, i) => (
            <div key={rota.caminho} className="rounded-md border border-border p-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <code className="text-sm font-medium">{rota.caminho}</code>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => void gerarRota(i)}
                    disabled={lote || gerando.includes(rota.caminho)}
                  >
                    <Sparkles className="size-4" />
                    {gerando.includes(rota.caminho) ? "Gerando…" : "Gerar com IA"}
                  </Button>
                  <label className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Switch
                      checked={rota.noindex}
                      onCheckedChange={(v) =>
                        setRotas((lista) =>
                          lista.map((r, j) => (i === j ? { ...r, noindex: v } : r)),
                        )
                      }
                    />
                    noindex
                  </label>
                </div>
              </div>


              <div className="mt-3 grid gap-3 lg:grid-cols-2">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Título</Label>
                    <Contador texto={rota.titulo} limite={60} />
                  </div>
                  <Input
                    value={rota.titulo}
                    onChange={(e) =>
                      setRotas((lista) =>
                        lista.map((r, j) =>
                          i === j ? { ...r, titulo: e.target.value } : r,
                        ),
                      )
                    }
                  />
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Descrição</Label>
                    <Contador texto={rota.descricao} limite={155} />
                  </div>
                  <Textarea
                    rows={3}
                    value={rota.descricao}
                    onChange={(e) =>
                      setRotas((lista) =>
                        lista.map((r, j) =>
                          i === j ? { ...r, descricao: e.target.value } : r,
                        ),
                      )
                    }
                  />
                  <Label className="text-xs">Palavras-chave</Label>
                  <Input
                    value={rota.keywords}
                    placeholder="termo, outro termo"
                    onChange={(e) =>
                      setRotas((lista) =>
                        lista.map((r, j) =>
                          i === j ? { ...r, keywords: e.target.value } : r,
                        ),
                      )
                    }
                  />
                </div>


                <GoogleSnippetPreview
                  url={`${SITE_URL}${rota.caminho === "/" ? "" : rota.caminho}`}
                  titulo={rota.titulo}
                  descricao={rota.descricao}
                  keywords={rota.keywords}
                />
              </div>
            </div>
          ))}
        </div>
        <Button className="mt-4" onClick={salvarRotas}>
          Salvar metas
        </Button>
      </Bloco>

      <Bloco titulo="D · Sitemap">
        <p className="text-sm text-muted-foreground">
          Última geração:{" "}
          {sitemapEm ? new Date(sitemapEm).toLocaleString("pt-BR") : "nunca"} · URLs
          previstas: <strong className="tabular-nums">{urlsSitemap}</strong>
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          O sitemap é montado a partir do catálogo mesclado, ignorando produtos ocultos,
          rotas com noindex e posts não publicados.
        </p>

        <div className="mt-4 space-y-1.5">
          <Label>Endereço do sitemap (use no Google Search Console)</Label>
          <div className="flex flex-wrap gap-2">
            <Input readOnly value={sitemapUrl} className="min-w-[16rem] flex-1" />
            <Button variant="outline" onClick={() => void copiarSitemap()}>
              <Copy className="size-4" /> Copiar
            </Button>
            <Button variant="outline" asChild>
              <a href={sitemapUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="size-4" /> Abrir
              </a>
            </Button>
            <Button variant="outline" onClick={() => void baixarSitemap()}>
              <Download className="size-4" /> Baixar XML
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            No Search Console, em “Sitemaps”, informe apenas <code>sitemap.xml</code>.
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={regerarSitemap} disabled={modo}>
            Regerar agora
          </Button>
          <Button
            variant="outline"
            onClick={() => void validarSitemap()}
            disabled={validando}
          >
            <ShieldCheck className="size-4" />
            {validando ? "Validando…" : "Validar sitemap"}
          </Button>
        </div>

        {validacao ? (
          <div className="mt-3 rounded-md border border-border p-3 text-sm">
            <p className="font-medium">
              {validacao.status === 200 && validacao.xmlOk
                ? "Sitemap pronto para envio"
                : "Sitemap com problema"}
            </p>
            <ul className="mt-2 space-y-1 text-muted-foreground">
              <li>
                Status HTTP:{" "}
                <strong
                  className={
                    validacao.status === 200 ? "text-emerald-600" : "text-destructive"
                  }
                >
                  {validacao.status}
                </strong>
              </li>
              <li>
                Formato XML:{" "}
                <strong
                  className={validacao.xmlOk ? "text-emerald-600" : "text-destructive"}
                >
                  {validacao.xmlOk ? "válido" : "inválido"}
                </strong>
              </li>
              <li>
                URLs encontradas:{" "}
                <strong className="tabular-nums text-foreground">{validacao.urls}</strong>{" "}
                (previstas: <span className="tabular-nums">{urlsSitemap}</span>)
              </li>
              <li>Verificado em {validacao.quando}</li>
            </ul>
            {validacao.urls === 0 ? (
              <p className="mt-2 text-xs text-amber-600">
                Nenhuma URL no arquivo. Com o modo construção ligado o sitemap sai vazio
                de propósito.
              </p>
            ) : null}
          </div>
        ) : null}
        {modo ? (
          <p className="mt-2 text-xs text-amber-600">
            Desabilitado enquanto o modo construção estiver ligado — o site inteiro está
            marcado como não indexável.
          </p>
        ) : null}
      </Bloco>

    </div>
  );
}

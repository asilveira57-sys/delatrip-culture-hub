import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { brands, categories, posts, products } from "@/lib/catalog";
import { SITE_URL } from "@/lib/seo";

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
  const [sitemapEm, setSitemapEm] = useState<string | null>(null);

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

  async function salvarRotas() {
    try {
      const { error } = await supabase.from("seo_rota").upsert(
        rotas.map((r) => ({
          caminho: r.caminho,
          titulo: r.titulo || null,
          descricao: r.descricao || null,
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

      <Bloco titulo="C · Meta das páginas">
        <div className="space-y-4">
          {rotas.map((rota, i) => (
            <div key={rota.caminho} className="rounded-md border border-border p-3">
              <div className="flex items-center justify-between gap-3">
                <code className="text-sm font-medium">{rota.caminho}</code>
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
                </div>

                <div className="rounded-md bg-muted/60 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Prévia no Google
                  </p>
                  <p className="mt-2 truncate text-xs text-emerald-700">
                    {SITE_URL}
                    {rota.caminho === "/" ? "" : rota.caminho}
                  </p>
                  <p className="truncate text-base text-blue-700">
                    {rota.titulo || "Título da página"}
                  </p>
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {rota.descricao || "Descrição que aparece no resultado de busca."}
                  </p>
                </div>
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
        <Button className="mt-4" onClick={regerarSitemap} disabled={modo}>
          Regerar agora
        </Button>
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

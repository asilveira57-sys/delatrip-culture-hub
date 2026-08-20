import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Eye, EyeOff, RotateCcw, Save, Sparkles, Undo2 } from "lucide-react";
import { toast } from "sonner";

import { BotaoSeoIa } from "@/components/admin/BotaoSeoIa";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { listarPostsAdmin } from "@/lib/blog-admin";
import {
  getCategoryById,
  getProduct,
  getProductDetail,
  products,
} from "@/lib/catalog";
import { verificarTexto } from "@/lib/enriquecer-core";
import { enriquecerProduto } from "@/lib/enriquecer.functions";
import {
  MAX_POSTS_RELACIONADOS,
  MAX_PRODUTOS_RELACIONADOS,
  carregarRelacionadosAdmin,
  copiarParaVariantes,
  obterOverlayAdmin,
  reverterOverlay,
  salvarOverlay,
  salvarRelacionadosAdmin,
  variantesDe,
  type OverlayAdmin,
} from "@/lib/produtos-admin";

export const Route = createFileRoute("/admin/_gate/produtos/$slug")({
  loader: ({ params }) => getProductDetail(params.slug),
  head: () => ({
    meta: [
      { title: "Editar produto — Admin DeLaTrip" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ProdutoAdminPage,
});

const VAZIO: OverlayAdmin = {
  slug: "",
  descricao_html: null,
  descricao_original: null,
  seo_titulo: null,
  seo_descricao: null,
  seo_keywords: null,
  oculto: false,
  destaque: null,
  enriquecido_em: null,
  enriquecido_modelo: null,
  status_revisao: null,
  observacao: null,
};

function Contador({ texto, limite }: { texto: string; limite: number }) {
  const n = texto.length;
  return (
    <span
      className={`text-xs ${n > limite ? "text-destructive" : "text-muted-foreground"}`}
    >
      {n}/{limite}
    </span>
  );
}

function ProdutoAdminPage() {
  const { slug } = Route.useParams();
  const detalhe = Route.useLoaderData();
  const queryClient = useQueryClient();
  const produto = getProduct(slug);
  const categoria = produto ? getCategoryById(produto.categoriaId) : undefined;
  const enriquecer = useServerFn(enriquecerProduto);

  const { data: overlaySalvo } = useQuery({
    queryKey: ["admin", "overlay", slug],
    queryFn: () => obterOverlayAdmin(slug),
    retry: false,
  });
  const { data: relacionadosSalvos } = useQuery({
    queryKey: ["admin", "relacionados", slug],
    queryFn: () => carregarRelacionadosAdmin(slug),
    retry: false,
  });
  const { data: posts } = useQuery({
    queryKey: ["admin", "posts"],
    queryFn: listarPostsAdmin,
    retry: false,
  });

  const [form, setForm] = useState<OverlayAdmin>({ ...VAZIO, slug });
  const [prodRel, setProdRel] = useState<string[]>([]);
  const [postRel, setPostRel] = useState<string[]>([]);
  const [buscaRel, setBuscaRel] = useState("");
  const [variantesSel, setVariantesSel] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (overlaySalvo) setForm({ ...VAZIO, ...overlaySalvo });
  }, [overlaySalvo]);
  useEffect(() => {
    if (relacionadosSalvos) {
      setProdRel(relacionadosSalvos.produtos);
      setPostRel(relacionadosSalvos.posts);
    }
  }, [relacionadosSalvos]);

  const original = detalhe?.descricaoHtml ?? "";
  const check = useMemo(
    () => (form.descricao_html ? verificarTexto(original, form.descricao_html) : null),
    [original, form.descricao_html],
  );
  const variantes = useMemo(
    () => (produto ? variantesDe(produto).slice(0, 30) : []),
    [produto],
  );
  const candidatos = useMemo(() => {
    const termo = buscaRel.trim().toLowerCase();
    if (!termo) return [];
    return products
      .filter((p) => p.slug !== slug && p.nome.toLowerCase().includes(termo))
      .slice(0, 8);
  }, [buscaRel, slug]);

  const salvar = useMutation({
    mutationFn: async () => {
      await salvarOverlay(slug, {
        descricao_html: form.descricao_html,
        seo_titulo: form.seo_titulo,
        seo_descricao: form.seo_descricao,
        seo_keywords: form.seo_keywords,
        oculto: form.oculto,
        destaque: form.destaque,
        status_revisao: form.status_revisao,
        observacao: form.observacao,
      });
      await salvarRelacionadosAdmin(slug, prodRel, postRel);
    },
    onSuccess: () => {
      toast.success("Sobreposição salva.");
      void queryClient.invalidateQueries({ queryKey: ["admin", "overlay", slug] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "overlays"] });
    },
    onError: () => toast.error("Não foi possível salvar."),
  });

  const reverter = useMutation({
    mutationFn: () => reverterOverlay(slug),
    onSuccess: () => {
      toast.success("Edição descartada — o site volta ao texto da Tray.");
      setForm({ ...VAZIO, slug, oculto: form.oculto, destaque: form.destaque });
      void queryClient.invalidateQueries({ queryKey: ["admin", "overlay", slug] });
    },
    onError: () => toast.error("Não foi possível reverter."),
  });

  const gerar = useMutation({
    mutationFn: () =>
      enriquecer({
        data: {
          slug,
          nome: produto?.nome ?? slug,
          marca: produto?.marca ?? null,
          categoria: categoria?.nome ?? null,
          descricaoOriginal: original,
        },
      }),
    onSuccess: (r) => {
      if (!r.ok) {
        toast.error(r.erro ?? "Falha ao gerar.");
        return;
      }
      setForm((f) => ({
        ...f,
        descricao_html: r.html,
        status_revisao: "pendente",
        observacao: r.motivos.join(" · ") || null,
      }));
      if (r.aprovado) toast.success("Texto gerado e aprovado nas verificações.");
      else toast.warning(`Gerado com ressalvas: ${r.motivos.join(" · ")}`);
    },
    onError: () => toast.error("Falha ao chamar a IA."),
  });

  const copiar = useMutation({
    mutationFn: () => copiarParaVariantes(form, [...variantesSel]),
    onSuccess: (n) => {
      toast.success(`Descrição copiada para ${n} variante(s).`);
      setVariantesSel(new Set());
      void queryClient.invalidateQueries({ queryKey: ["admin", "overlays"] });
    },
    onError: () => toast.error("Não foi possível copiar."),
  });

  if (!produto) {
    return (
      <div>
        <p className="text-sm">Produto não encontrado no catálogo JSON.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/admin/produtos">Voltar</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <Button asChild size="sm" variant="ghost" className="-ml-2">
            <Link to="/admin/produtos">
              <ArrowLeft className="size-4" aria-hidden="true" />
              Produtos
            </Link>
          </Button>
          <h1 className="mt-1 truncate text-xl font-semibold">{produto.nome}</h1>
          <p className="text-xs text-muted-foreground">{slug}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => gerar.mutate()}
            disabled={gerar.isPending}
          >
            <Sparkles className="size-4" aria-hidden="true" />
            {gerar.isPending ? "Gerando…" : "Enriquecer com IA"}
          </Button>
          <Button onClick={() => salvar.mutate()} disabled={salvar.isPending}>
            <Save className="size-4" aria-hidden="true" />
            Salvar
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[1fr_1fr_18rem]">
        {/* Coluna 1 — origem Tray, somente leitura */}
        <section className="rounded-lg border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">Origem (Tray)</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Somente leitura. Esta é a única fonte de fatos permitida.
          </p>
          <dl className="mt-3 space-y-1 text-xs text-muted-foreground">
            <div>Marca: {produto.marca ?? "—"}</div>
            <div>Categoria: {categoria?.nome ?? "—"}</div>
            <div>Referência: {produto.referencia ?? "—"}</div>
          </dl>
          <div
            className="conteudo-rico mt-4 max-h-[28rem] overflow-y-auto rounded border border-border/60 bg-background p-3 text-sm"
            dangerouslySetInnerHTML={{ __html: original }}
          />
        </section>

        {/* Coluna 2 — edição */}
        <section className="rounded-lg border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">Edição (sobreposição)</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            O texto abaixo só aparece no site depois de aprovado na revisão.
          </p>

          <div className="mt-3">
            <RichTextEditor
              valor={form.descricao_html ?? ""}
              onChange={(html) => setForm((f) => ({ ...f, descricao_html: html }))}
              baseArquivo={`produto-${slug}`}
              minAltura="18rem"
              placeholder="Descrição editorial do produto"
            />
          </div>

          {check && (
            <ul className="mt-3 space-y-1 text-xs">
              <li className="text-muted-foreground">
                {check.caracteres} caracteres · aderência {Math.round(check.similaridade * 100)}%
              </li>
              {check.motivos.map((m) => (
                <li key={m} className="text-destructive">
                  • {m}
                </li>
              ))}
              {check.aprovado && (
                <li className="text-primary">• Passou em todas as verificações</li>
              )}
            </ul>
          )}

          <div className="mt-5 space-y-3">
            <BotaoSeoIa
              tipo="produto"
              titulo={produto?.nome ?? slug}
              contexto={form.descricao_html || original}
              extra={[
                produto?.marca ? `Marca: ${produto.marca}` : null,
                categoria ? `Categoria: ${categoria.nome}` : null,
              ]
                .filter(Boolean)
                .join(" · ")}
              vazio={
                !form.seo_titulo?.trim() &&
                !form.seo_descricao?.trim() &&
                !form.seo_keywords?.trim()
              }
              onGerado={(seo) =>
                setForm((f) => ({
                  ...f,
                  seo_titulo: seo.titulo,
                  seo_descricao: seo.descricao,
                  seo_keywords: seo.keywords,
                }))
              }
            />
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="seo-titulo">Título SEO</Label>
                <Contador texto={form.seo_titulo ?? ""} limite={60} />
              </div>
              <Input
                id="seo-titulo"
                value={form.seo_titulo ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, seo_titulo: e.target.value || null }))
                }
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="seo-desc">Descrição SEO</Label>
                <Contador texto={form.seo_descricao ?? ""} limite={160} />
              </div>
              <Textarea
                id="seo-desc"
                rows={3}
                value={form.seo_descricao ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, seo_descricao: e.target.value || null }))
                }
              />
            </div>
            <div>
              <Label htmlFor="seo-keywords">Palavras-chave</Label>
              <Input
                id="seo-keywords"
                value={form.seo_keywords ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, seo_keywords: e.target.value || null }))
                }
                placeholder="termo um, termo dois, termo três"
              />
            </div>
          </div>
        </section>

        <div className="lg:col-span-2">
          <FaqEditor
            tipo="produto"
            alvo={slug}
            titulo={produto?.nome ?? slug}
            contexto={form.descricao_html || original}
            extra={[
              produto?.marca ? `Marca: ${produto.marca}` : null,
              categoria ? `Categoria: ${categoria.nome}` : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          />
        </div>


        {/* Coluna 3 — ações */}
        <aside className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-4 text-sm">
            <h2 className="text-sm font-semibold">Revisão</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Status: {form.status_revisao ?? "sem edição"}
            </p>
            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                variant={form.status_revisao === "aprovado" ? "default" : "outline"}
                onClick={() => setForm((f) => ({ ...f, status_revisao: "aprovado" }))}
              >
                Aprovar
              </Button>
              <Button
                size="sm"
                variant={form.status_revisao === "reprovado" ? "default" : "outline"}
                onClick={() => setForm((f) => ({ ...f, status_revisao: "reprovado" }))}
              >
                Reprovar
              </Button>
            </div>
            {form.observacao && (
              <p className="mt-3 text-xs text-muted-foreground">{form.observacao}</p>
            )}
          </div>

          <div className="rounded-lg border border-border bg-card p-4 text-sm">
            <h2 className="text-sm font-semibold">Visibilidade</h2>
            <label className="mt-3 flex items-center gap-2 text-xs">
              <Checkbox
                checked={form.oculto}
                onCheckedChange={(v) => setForm((f) => ({ ...f, oculto: v === true }))}
              />
              {form.oculto ? (
                <EyeOff className="size-3.5" aria-hidden="true" />
              ) : (
                <Eye className="size-3.5" aria-hidden="true" />
              )}
              Ocultar do site (mantém a edição salva)
            </label>
            <label className="mt-2 flex items-center gap-2 text-xs">
              <Checkbox
                checked={form.destaque === true}
                onCheckedChange={(v) =>
                  setForm((f) => ({ ...f, destaque: v === true ? true : null }))
                }
              />
              Marcar como destaque
            </label>
            <Button
              size="sm"
              variant="outline"
              className="mt-4 w-full"
              onClick={() => reverter.mutate()}
              disabled={reverter.isPending}
            >
              <RotateCcw className="size-4" aria-hidden="true" />
              Reverter edições
            </Button>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Reverter descarta o texto e o SEO da sobreposição — diferente de
              ocultar, que só tira o produto do site.
            </p>
          </div>

          <div className="rounded-lg border border-border bg-card p-4 text-sm">
            <h2 className="text-sm font-semibold">Copiar para variantes</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Mesma marca e nome equivalente (display, caixa, unidades).
            </p>
            {variantes.length === 0 ? (
              <p className="mt-3 text-xs text-muted-foreground">
                Nenhuma variante detectada.
              </p>
            ) : (
              <>
                <ul className="mt-3 max-h-56 space-y-1 overflow-y-auto text-xs">
                  {variantes.map((v) => (
                    <li key={v.slug} className="flex items-start gap-2">
                      <Checkbox
                        checked={variantesSel.has(v.slug)}
                        onCheckedChange={() =>
                          setVariantesSel((atual) => {
                            const novo = new Set(atual);
                            if (novo.has(v.slug)) novo.delete(v.slug);
                            else novo.add(v.slug);
                            return novo;
                          })
                        }
                        aria-label={`Selecionar ${v.nome}`}
                      />
                      <span>{v.nome}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3 w-full"
                  disabled={variantesSel.size === 0 || !form.descricao_html || copiar.isPending}
                  onClick={() => copiar.mutate()}
                >
                  <Undo2 className="size-4 rotate-180" aria-hidden="true" />
                  Copiar para {variantesSel.size} variante(s)
                </Button>
              </>
            )}
          </div>
        </aside>
      </div>

      {/* Relacionados */}
      <section className="mt-6 grid gap-5 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">
            Produtos relacionados ({prodRel.length}/{MAX_PRODUTOS_RELACIONADOS})
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Quando houver amarração manual, ela substitui a lista automática por
            categoria na página pública.
          </p>
          <Input
            className="mt-3"
            value={buscaRel}
            onChange={(e) => setBuscaRel(e.target.value)}
            placeholder="Buscar produto para relacionar"
          />
          {candidatos.length > 0 && (
            <ul className="mt-2 space-y-1 text-xs">
              {candidatos.map((c) => (
                <li key={c.slug}>
                  <button
                    className="w-full rounded px-2 py-1 text-left hover:bg-muted disabled:opacity-50"
                    disabled={
                      prodRel.includes(c.slug) ||
                      prodRel.length >= MAX_PRODUTOS_RELACIONADOS
                    }
                    onClick={() => {
                      setProdRel((a) => [...a, c.slug]);
                      setBuscaRel("");
                    }}
                  >
                    + {c.nome}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <ul className="mt-3 space-y-1 text-sm">
            {prodRel.map((s) => (
              <li key={s} className="flex items-center justify-between gap-2">
                <span className="truncate">{getProduct(s)?.nome ?? s}</span>
                <button
                  className="text-xs text-muted-foreground underline"
                  onClick={() => setProdRel((a) => a.filter((x) => x !== s))}
                >
                  remover
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">
            Posts relacionados ({postRel.length}/{MAX_POSTS_RELACIONADOS})
          </h2>
          <ul className="mt-3 max-h-64 space-y-1 overflow-y-auto text-sm">
            {(posts ?? []).map((p) => {
              const marcado = postRel.includes(p.slug);
              return (
                <li key={p.slug} className="flex items-start gap-2 text-xs">
                  <Checkbox
                    checked={marcado}
                    disabled={!marcado && postRel.length >= MAX_POSTS_RELACIONADOS}
                    onCheckedChange={() =>
                      setPostRel((a) =>
                        a.includes(p.slug) ? a.filter((x) => x !== p.slug) : [...a, p.slug],
                      )
                    }
                    aria-label={`Relacionar ${p.titulo}`}
                  />
                  <span>{p.titulo}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <div className="mt-6">
        <Button onClick={() => salvar.mutate()} disabled={salvar.isPending}>
          <Save className="size-4" aria-hidden="true" />
          Salvar alterações
        </Button>
      </div>
    </div>
  );
}

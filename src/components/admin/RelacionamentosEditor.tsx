import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Boxes, Check, Link2, Pin, RefreshCw, Search, Sparkles, X } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { categories, imageFor, getProduct, products } from "@/lib/catalog";
import { marcasEfetivas, slugsDaMarca, useMarcaOverlays } from "@/lib/marcas";

const LIMITE_LOTE = 200;
import { listarPostsAdmin } from "@/lib/blog-admin";
import {
  atualizarStatusLink,
  aplicarLinkNoHtml,
  carregarConfigGlobal,
  carregarConfigPost,
  gerarLinksInternos,
  gravarRelacaoPost,
  gravarRelacaoProduto,
  removerRelacaoProduto,
  listarClusters,
  listarTodasTags,
  clustersDoPost,
  listarLinksInternos,
  pontuarPosts,
  pontuarProdutos,
  recalcularPost,
  relacoesPost,
  relacoesProduto,
  salvarCluster,
  salvarClustersDoPost,
  salvarConfigPost,
  salvarTagsDoPost,
  tagsDoPost,
} from "@/lib/relacionamentos-admin";
import {
  MODOS_CONTEUDOS,
  MODOS_PRODUTOS,
  ORDENACOES,
  QUANTIDADES_CONTEUDOS,
  QUANTIDADES_PRODUTOS,
  rotuloRelevancia,
  type DocumentoPost,
  type ModoConteudos,
  type ModoProdutos,
  type Ordenacao,
} from "@/lib/relacionamentos-core";
import { gerarSlug } from "@/lib/blog-admin";
import { gerarTaxonomiaIa } from "@/lib/taxonomia-ia.functions";
import { MARCADOR_PRODUTOS, dividirNoMarcador } from "@/lib/sanitize";

type Props = {
  slug: string;
  doc: DocumentoPost;
  habilitado: boolean;
  /** Permite aplicar um link interno aceito diretamente no corpo do post. */
  conteudoHtml: string;
  onConteudoHtml: (html: string) => void;
};

function Relevancia({ score }: { score: number }) {
  return (
    <span className="text-xs text-muted-foreground">
      {score}% — {rotuloRelevancia(score)}
    </span>
  );
}

export function RelacionamentosEditor({
  slug,
  doc,
  habilitado,
  conteudoHtml,
  onConteudoHtml,
}: Props) {
  const queryClient = useQueryClient();
  const [buscaCategoria, setBuscaCategoria] = useState("");
  const [buscaProduto, setBuscaProduto] = useState("");
  const [buscaPost, setBuscaPost] = useState("");
  const [novaTag, setNovaTag] = useState("");
  const [novoCluster, setNovoCluster] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [fonteProdutos, setFonteProdutos] = useState<"sugeridos" | "todos">("sugeridos");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroMarca, setFiltroMarca] = useState("");
  const [somenteEstoque, setSomenteEstoque] = useState(false);
  const [limiteLista, setLimiteLista] = useState(60);
  const mapaMarcas = useMarcaOverlays();
  const marcasDisponiveis = useMemo(
    () => [...marcasEfetivas(mapaMarcas)].sort((a, b) => a.nome.localeCompare(b.nome)),
    [mapaMarcas],
  );
  const categoriasDisponiveis = useMemo(() => {
    const usadas = new Set(products.map((p) => p.categoriaSlug).filter(Boolean));
    return categories
      .filter((c) => usadas.has(c.slug))
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, []);

  const chave = ["admin", "relacionamentos", slug];
  const { data, isLoading } = useQuery({
    queryKey: chave,
    enabled: habilitado,
    retry: false,
    queryFn: async () => {
      const [global, config, produtos, posts, clusters, meusClusters, tags, todasTags, links, todosPosts] =
        await Promise.all([
          carregarConfigGlobal(),
          carregarConfigPost(slug),
          relacoesProduto(slug),
          relacoesPost(slug),
          listarClusters(),
          clustersDoPost(slug),
          tagsDoPost(slug),
          listarTodasTags(),
          listarLinksInternos(slug),
          listarPostsAdmin(),
        ]);
      return { global, config, produtos, posts, clusters, meusClusters, tags, todasTags, links, todosPosts };
    },
  });

  const candidatos: DocumentoPost[] = useMemo(
    () =>
      (data?.todosPosts ?? []).map((p) => ({
        slug: p.slug,
        titulo: p.titulo,
        resumo: p.resumo,
        conteudoHtml: p.conteudo_html,
        categoria: p.categoria,
        seoTitulo: p.seo_titulo,
        seoDescricao: p.seo_descricao,
        keywords: p.seo_keywords ?? null,
        data: p.publicado_em,
      })),
    [data?.todosPosts],
  );

  const docCompleto: DocumentoPost = useMemo(
    () => ({
      ...doc,
      tags: data?.tags ?? [],
      clusters: (data?.meusClusters ?? []).map(
        (c) => data?.clusters.find((x) => x.slug === c.cluster_slug)?.nome ?? c.cluster_slug,
      ),
    }),
    [doc, data],
  );

  const sugestoesProduto = useMemo(() => {
    if (!data) return [];
    return pontuarProdutos(docCompleto, data.config, data.global);
  }, [data, docCompleto]);

  const sugestoesPost = useMemo(() => {
    if (!data) return [];
    return pontuarPosts(docCompleto, candidatos, data.global);
  }, [data, docCompleto, candidatos]);

  const temBloco = dividirNoMarcador(conteudoHtml)[1] !== null;

  /** Insere (no meio do texto) ou remove o bloco de produtos relacionados. */
  function alternarBloco() {
    if (temBloco) {
      const [antes, depois] = dividirNoMarcador(conteudoHtml);
      onConteudoHtml(`${antes}${depois ?? ""}`);
      toast.success("Bloco removido do texto.");
      return;
    }
    const partes = conteudoHtml.split(/(?<=<\/p>)/i).filter((p) => p.trim());
    if (partes.length < 2) {
      onConteudoHtml(`${conteudoHtml}${MARCADOR_PRODUTOS}`);
    } else {
      const meio = Math.ceil(partes.length / 2);
      onConteudoHtml(
        `${partes.slice(0, meio).join("")}${MARCADOR_PRODUTOS}${partes.slice(meio).join("")}`,
      );
    }
    toast.success("Bloco inserido. Salve o post para publicar.");
  }

  /** Pede tags e cluster à IA e grava as sugestões aceitas de uma vez. */
  async function sugerirTaxonomia() {
    if (!data) return;
    setOcupado(true);
    try {
      const resultado = await gerarTaxonomiaIa({
        data: {
          titulo: doc.titulo,
          contexto: [doc.resumo ?? "", conteudoHtml].join("\n"),
          clustersExistentes: data.clusters.map((c) => c.nome),
        },
      });
      if (!resultado.ok) {
        toast.error(resultado.erro ?? "Falha ao sugerir taxonomia.");
        return;
      }
      const tags = [...new Set([...data.tags, ...resultado.tags])];
      await salvarTagsDoPost(slug, tags);
      if (resultado.cluster) {
        const slugCluster = gerarSlug(resultado.cluster);
        const existente = data.clusters.find((c) => c.slug === slugCluster);
        if (!existente) {
          await salvarCluster({ slug: slugCluster, nome: resultado.cluster, descricao: null });
        }
        const outros = data.meusClusters.filter((m) => m.cluster_slug !== slugCluster);
        await salvarClustersDoPost(slug, [
          ...outros,
          { cluster_slug: slugCluster, principal: outros.length === 0 },
        ]);
      }
      await recarregar();
      toast.success("Tags e cluster sugeridos pela IA.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao chamar a IA.");
    } finally {
      setOcupado(false);
    }
  }

  async function recarregar() {
    await queryClient.invalidateQueries({ queryKey: chave });
  }

  async function executar(acao: () => Promise<unknown>, mensagem?: string) {
    setOcupado(true);
    try {
      await acao();
      await recarregar();
      if (mensagem) toast.success(mensagem);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha na operação.");
    } finally {
      setOcupado(false);
    }
  }

  if (!habilitado) {
    return (
      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="text-base font-semibold">Relacionamentos</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Salve o post uma vez para liberar produtos, conteúdos e links internos.
        </p>
      </section>
    );
  }

  if (isLoading || !data) {
    return (
      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="text-base font-semibold">Relacionamentos</h2>
        <p className="mt-2 text-sm text-muted-foreground">Carregando…</p>
      </section>
    );
  }

  const { config, global } = data;
  const relProduto = new Map(data.produtos.map((r) => [r.slug, r]));
  const relPost = new Map(data.posts.map((r) => [r.slug, r]));

  const categoriasFiltradas = categories
    .filter((c) => c.nome.toLowerCase().includes(buscaCategoria.toLowerCase()))
    .slice(0, 200);

  const normalizar = (t: string) =>
    t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const termo = normalizar(buscaProduto.trim());
  const slugsMarca = filtroMarca ? new Set(slugsDaMarca(filtroMarca, mapaMarcas)) : null;
  const scorePorSlug = new Map(sugestoesProduto.map((s) => [s.produto.slug, s]));
  const base =
    fonteProdutos === "sugeridos"
      ? sugestoesProduto
      : products.map(
          (p) => scorePorSlug.get(p.slug) ?? { produto: p, score: 0, origens: [] as string[] },
        );
  const listaProdutos = base.filter((s) => {
    const p = s.produto;
    if (filtroCategoria && p.categoriaSlug !== filtroCategoria) return false;
    if (slugsMarca && !(p.marcaSlug && slugsMarca.has(p.marcaSlug))) return false;
    if (somenteEstoque && p.estoque <= 0) return false;
    if (termo) {
      const alvo = normalizar(`${p.nome} ${p.marca ?? ""} ${p.referencia ?? ""}`);
      if (!alvo.includes(termo)) return false;
    }
    return true;
  });
  const selecionadosNaLista = listaProdutos.filter(
    (s) => relProduto.get(s.produto.slug)?.manual,
  ).length;

  function selecionarEmLote(marcar: boolean) {
    const alvo = listaProdutos
      .filter((s) => (relProduto.get(s.produto.slug)?.manual ?? false) !== marcar)
      .slice(0, LIMITE_LOTE);
    if (alvo.length === 0) return;
    void executar(
      () =>
        Promise.all(
          alvo.map((s) => {
            const atual = relProduto.get(s.produto.slug);
            return gravarRelacaoProduto(slug, {
              slug: s.produto.slug,
              origem: s.origens.join(" + ") || "manual",
              score: s.score,
              manual: marcar,
              excluido: false,
              fixado: marcar ? (atual?.fixado ?? false) : false,
              posicao: atual?.posicao ?? 0,
            });
          }),
        ),
      marcar ? `${alvo.length} produto(s) selecionado(s).` : `${alvo.length} produto(s) desmarcado(s).`,
    );
  }
  const postsVisiveis = sugestoesPost.filter((s) =>
    s.post.titulo.toLowerCase().includes(buscaPost.toLowerCase()),
  );

  function alterarConfig(parcial: Partial<typeof config>) {
    void executar(() => salvarConfigPost({ ...config, ...parcial }));
  }

  function alternarProduto(slugProduto: string, score: number, origem: string) {
    const atual = relProduto.get(slugProduto);
    const selecionado = atual?.manual === true;
    void executar(() =>
      gravarRelacaoProduto(slug, {
        slug: slugProduto,
        origem,
        score,
        manual: !selecionado,
        excluido: false,
        fixado: atual?.fixado ?? false,
        posicao: atual?.posicao ?? 0,
      }),
    );
  }

  function excluirProduto(slugProduto: string, score: number, origem: string) {
    const atual = relProduto.get(slugProduto);
    void executar(() =>
      gravarRelacaoProduto(slug, {
        slug: slugProduto,
        origem,
        score,
        manual: false,
        excluido: !(atual?.excluido ?? false),
        fixado: false,
        posicao: atual?.posicao ?? 0,
      }),
    );
  }

  function fixarProduto(slugProduto: string, score: number, origem: string) {
    const atual = relProduto.get(slugProduto);
    void executar(() =>
      gravarRelacaoProduto(slug, {
        slug: slugProduto,
        origem,
        score,
        manual: true,
        excluido: false,
        fixado: !(atual?.fixado ?? false),
        posicao: atual?.posicao ?? 0,
      }),
    );
  }

  function alternarPostRelacionado(
    slugDestino: string,
    score: number,
    origem: string,
    campo: "manual" | "excluido" | "fixado",
  ) {
    const atual = relPost.get(slugDestino);
    const base = {
      slug: slugDestino,
      origem,
      score,
      manual: atual?.manual ?? false,
      excluido: atual?.excluido ?? false,
      fixado: atual?.fixado ?? false,
      posicao: atual?.posicao ?? 0,
    };
    const proximo = { ...base, [campo]: !base[campo] };
    if (campo === "fixado" && proximo.fixado) proximo.manual = true;
    if (campo === "excluido" && proximo.excluido) {
      proximo.manual = false;
      proximo.fixado = false;
    }
    void executar(() => gravarRelacaoPost(slug, proximo));
  }

  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold">Relacionamentos</h2>
          <p className="text-xs text-muted-foreground">
            {config.recalculado_em
              ? `Recalculado em ${new Date(config.recalculado_em).toLocaleString("pt-BR")}`
              : "Ainda não recalculado"}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={ocupado}
          onClick={() =>
            void executar(
              () => recalcularPost(docCompleto, candidatos, { config, global }),
              "Relacionamentos recalculados.",
            )
          }
        >
          <RefreshCw className="size-4" /> Recalcular
        </Button>
      </div>

      <Tabs defaultValue="produtos" className="mt-4">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="produtos">Produtos</TabsTrigger>
          <TabsTrigger value="conteudos">Conteúdos</TabsTrigger>
          <TabsTrigger value="links">SEO interno</TabsTrigger>
          <TabsTrigger value="cluster">Cluster e tags</TabsTrigger>
        </TabsList>

        {/* ---------------- Produtos ---------------- */}
        <TabsContent value="produtos" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3">
            <p className="text-xs text-muted-foreground">
              {temBloco
                ? "O bloco de produtos está inserido no meio do texto."
                : "Insira o bloco de produtos no meio do texto do post."}
            </p>
            <Button
              variant="outline"
              size="sm"
              disabled={ocupado}
              onClick={() => alternarBloco()}
            >
              <Boxes className="size-4" />
              {temBloco ? "Remover bloco do texto" : "Inserir bloco no texto"}
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label>Modo</Label>
              <Select
                value={config.modo_produtos}
                onValueChange={(v) => alterarConfig({ modo_produtos: v as ModoProdutos })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MODOS_PRODUTOS.map((m) => (
                    <SelectItem key={m.valor} value={m.valor}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Quantidade exibida</Label>
              <Select
                value={String(config.quantidade_produtos ?? "")}
                onValueChange={(v) =>
                  alterarConfig({ quantidade_produtos: v === "global" ? null : Number(v) })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={`Global (${global.quantidadeProdutos})`} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">Global ({global.quantidadeProdutos})</SelectItem>
                  {QUANTIDADES_PRODUTOS.map((q) => (
                    <SelectItem key={q} value={String(q)}>
                      {q}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Ordenação</Label>
              <Select
                value={config.ordenacao_produtos}
                onValueChange={(v) => alterarConfig({ ordenacao_produtos: v as Ordenacao })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ORDENACOES.map((o) => (
                    <SelectItem key={o.valor} value={o.valor}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between gap-2">
              <Label>Categorias relacionadas ({config.categorias.length})</Label>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    alterarConfig({ categorias: categoriasFiltradas.map((c) => c.slug) })
                  }
                >
                  Selecionar todas
                </Button>
                <Button size="sm" variant="ghost" onClick={() => alterarConfig({ categorias: [] })}>
                  Remover todas
                </Button>
              </div>
            </div>
            <div className="relative mt-2">
              <Search className="pointer-events-none absolute left-2 top-2.5 size-4 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="Pesquisar categoria"
                value={buscaCategoria}
                onChange={(e) => setBuscaCategoria(e.target.value)}
              />
            </div>
            <div className="mt-2 max-h-48 space-y-1 overflow-y-auto rounded border border-border p-2">
              {categoriasFiltradas.map((c) => {
                const marcada = config.categorias.includes(c.slug);
                return (
                  <label key={c.id} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={marcada}
                      onCheckedChange={() =>
                        alterarConfig({
                          categorias: marcada
                            ? config.categorias.filter((s) => s !== c.slug)
                            : [...config.categorias, c.slug],
                        })
                      }
                    />
                    {c.nome}
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="inline-flex rounded-md border border-border p-0.5">
                <Button
                  size="sm"
                  variant={fonteProdutos === "sugeridos" ? "default" : "ghost"}
                  onClick={() => setFonteProdutos("sugeridos")}
                >
                  Sugeridos
                </Button>
                <Button
                  size="sm"
                  variant={fonteProdutos === "todos" ? "default" : "ghost"}
                  onClick={() => setFonteProdutos("todos")}
                >
                  Todos os produtos
                </Button>
              </div>
              <span className="text-xs text-muted-foreground">
                {listaProdutos.length} produto(s) · {selecionadosNaLista} selecionado(s)
              </span>
            </div>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              <div className="relative sm:col-span-3">
                <Search className="pointer-events-none absolute left-2 top-2.5 size-4 text-muted-foreground" />
                <Input
                  className="pl-8"
                  placeholder="Pesquisar produto por nome, marca ou referência"
                  value={buscaProduto}
                  onChange={(e) => setBuscaProduto(e.target.value)}
                />
              </div>
              <select
                className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
                aria-label="Filtrar por categoria"
              >
                <option value="">Todas as categorias</option>
                {categoriasDisponiveis.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.nome}
                  </option>
                ))}
              </select>
              <select
                className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                value={filtroMarca}
                onChange={(e) => setFiltroMarca(e.target.value)}
                aria-label="Filtrar por marca"
              >
                <option value="">Todas as marcas</option>
                {marcasDisponiveis.map((m) => (
                  <option key={m.slug} value={m.slug}>
                    {m.nome}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={somenteEstoque}
                  onCheckedChange={(v) => setSomenteEstoque(v === true)}
                />
                Só em estoque
              </label>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={ocupado || listaProdutos.length === 0}
                onClick={() => selecionarEmLote(true)}
              >
                <Check className="mr-1 size-4" /> Selecionar todos ({Math.min(listaProdutos.length, LIMITE_LOTE)})
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={ocupado || selecionadosNaLista === 0}
                onClick={() => selecionarEmLote(false)}
              >
                Desmarcar todos
              </Button>
              {filtroCategoria || filtroMarca || buscaProduto || somenteEstoque ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setFiltroCategoria("");
                    setFiltroMarca("");
                    setBuscaProduto("");
                    setSomenteEstoque(false);
                  }}
                >
                  Limpar filtros
                </Button>
              ) : null}
            </div>
            <ul className="mt-2 max-h-[28rem] space-y-2 overflow-y-auto rounded border border-border p-2">
              {listaProdutos.slice(0, limiteLista).map((s) => {
                const rel = relProduto.get(s.produto.slug);
                const origem = s.origens.join(" + ") || "manual";
                return (
                  <li
                    key={s.produto.slug}
                    className="flex items-center gap-3 rounded border border-border/60 p-2"
                  >
                    <Checkbox
                      checked={rel?.manual ?? false}
                      disabled={ocupado}
                      onCheckedChange={() => alternarProduto(s.produto.slug, s.score, origem)}
                    />
                    <img
                      src={imageFor(s.produto)}
                      alt=""
                      className="size-12 shrink-0 rounded object-cover"
                      loading="lazy"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{s.produto.nome}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {s.produto.marca ?? "sem marca"} · {s.produto.categoriaNome ?? "sem categoria"} ·{" "}
                        {s.produto.estoque > 0 ? "em estoque" : "sem estoque"}
                        {s.score > 0 ? ` · origem: ${s.origens.join(" + ") || "conteúdo"}` : ""}
                      </p>
                      {s.score > 0 ? <Relevancia score={s.score} /> : null}
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        size="icon"
                        variant={rel?.fixado ? "default" : "ghost"}
                        title="Fixar nas primeiras posições"
                        onClick={() => fixarProduto(s.produto.slug, s.score, origem)}
                      >
                        <Pin className="size-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant={rel?.excluido ? "destructive" : "ghost"}
                        title="Excluir deste post"
                        onClick={() => excluirProduto(s.produto.slug, s.score, origem)}
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                  </li>
                );
              })}
              {listaProdutos.length > limiteLista ? (
                <li className="text-center">
                  <Button size="sm" variant="ghost" onClick={() => setLimiteLista((n) => n + 60)}>
                    Mostrar mais ({listaProdutos.length - limiteLista} restantes)
                  </Button>
                </li>
              ) : null}
              {listaProdutos.length === 0 ? (
                <li className="p-2 text-sm text-muted-foreground">
                  {fonteProdutos === "sugeridos"
                    ? "Nenhuma sugestão automática. Use “Todos os produtos” para escolher livremente."
                    : "Nenhum produto encontrado com esses filtros."}
                </li>
              ) : null}
            </ul>
          </div>

          <div className="rounded border border-border p-3">
            <p className="text-sm font-medium">Selecionados e excluídos</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {data.produtos
                .filter((r) => r.manual || r.fixado || r.excluido)
                .map((r) => (
                  <Badge
                    key={r.slug}
                    variant={r.excluido ? "destructive" : "secondary"}
                    className="gap-1"
                  >
                    {getProduct(r.slug)?.nome ?? r.slug}
                    {r.fixado ? " · fixado" : r.excluido ? " · excluído" : ""}
                    <button
                      type="button"
                      className="ml-1 rounded hover:opacity-70"
                      title="Remover"
                      disabled={ocupado}
                      onClick={() =>
                        void executar(() => removerRelacaoProduto(slug, r.slug))
                      }
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))}
              {data.produtos.every((r) => !r.manual && !r.fixado && !r.excluido) ? (
                <span className="text-xs text-muted-foreground">Nada definido manualmente.</span>
              ) : null}
            </div>
          </div>
        </TabsContent>

        {/* ---------------- Conteúdos ---------------- */}
        <TabsContent value="conteudos" className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label>Modo</Label>
              <Select
                value={config.modo_conteudos}
                onValueChange={(v) => alterarConfig({ modo_conteudos: v as ModoConteudos })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MODOS_CONTEUDOS.map((m) => (
                    <SelectItem key={m.valor} value={m.valor}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Quantidade exibida</Label>
              <Select
                value={String(config.quantidade_conteudos ?? "")}
                onValueChange={(v) =>
                  alterarConfig({ quantidade_conteudos: v === "global" ? null : Number(v) })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={`Global (${global.quantidadeConteudos})`} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">Global ({global.quantidadeConteudos})</SelectItem>
                  {QUANTIDADES_CONTEUDOS.map((q) => (
                    <SelectItem key={q} value={String(q)}>
                      {q}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Ordenação</Label>
              <Select
                value={config.ordenacao_conteudos}
                onValueChange={(v) => alterarConfig({ ordenacao_conteudos: v as Ordenacao })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ORDENACOES.map((o) => (
                    <SelectItem key={o.valor} value={o.valor}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-2.5 size-4 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="Pesquisar postagem por título"
              value={buscaPost}
              onChange={(e) => setBuscaPost(e.target.value)}
            />
          </div>

          <ul className="max-h-96 space-y-2 overflow-y-auto rounded border border-border p-2">
            {postsVisiveis.slice(0, 40).map((s) => {
              const rel = relPost.get(s.post.slug);
              return (
                <li
                  key={s.post.slug}
                  className="flex items-center gap-3 rounded border border-border/60 p-2"
                >
                  <Checkbox
                    checked={rel?.manual ?? false}
                    disabled={ocupado}
                    onCheckedChange={() =>
                      alternarPostRelacionado(
                        s.post.slug,
                        s.score,
                        s.origens.join(" + "),
                        "manual",
                      )
                    }
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{s.post.titulo}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {s.post.categoria ?? "sem categoria"} · origem:{" "}
                      {s.origens.join(" + ") || "conteúdo"}
                    </p>
                    <Relevancia score={s.score} />
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      size="icon"
                      variant={rel?.fixado ? "default" : "ghost"}
                      title="Fixar"
                      onClick={() =>
                        alternarPostRelacionado(
                          s.post.slug,
                          s.score,
                          s.origens.join(" + "),
                          "fixado",
                        )
                      }
                    >
                      <Pin className="size-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant={rel?.excluido ? "destructive" : "ghost"}
                      title="Excluir deste post"
                      onClick={() =>
                        alternarPostRelacionado(
                          s.post.slug,
                          s.score,
                          s.origens.join(" + "),
                          "excluido",
                        )
                      }
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                </li>
              );
            })}
            {postsVisiveis.length === 0 ? (
              <li className="p-2 text-sm text-muted-foreground">
                Nenhuma postagem relacionada encontrada.
              </li>
            ) : null}
          </ul>
        </TabsContent>

        {/* ---------------- Links internos ---------------- */}
        <TabsContent value="links" className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              Sugestões de links internos (3 a {global.maxLinksInternos} por artigo). Nada é
              inserido sem sua aprovação.
            </p>
            <Button
              size="sm"
              variant="outline"
              disabled={ocupado}
              onClick={() =>
                void executar(
                  () => gerarLinksInternos(docCompleto, candidatos, global.maxLinksInternos),
                  "Sugestões atualizadas.",
                )
              }
            >
              <Link2 className="size-4" /> Gerar sugestões
            </Button>
          </div>
          <ul className="space-y-2">
            {data.links.map((l) => (
              <li
                key={l.id}
                className="flex flex-wrap items-center gap-2 rounded border border-border p-2 text-sm"
              >
                <span className="font-medium">“{l.ancora}”</span>
                <span className="text-muted-foreground">→ /blog/{l.slug_destino}</span>
                <Badge variant="secondary">{l.status}</Badge>
                <div className="ml-auto flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={l.status === "aceito"}
                    onClick={() => {
                      const html = aplicarLinkNoHtml(conteudoHtml, l.ancora, l.slug_destino);
                      if (!html) {
                        toast.error("Âncora não encontrada no texto atual.");
                        return;
                      }
                      onConteudoHtml(html);
                      void executar(
                        () => atualizarStatusLink(l.id, "aceito"),
                        "Link adicionado ao texto. Salve o post.",
                      );
                    }}
                  >
                    <Check className="size-4" /> Adicionar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => void executar(() => atualizarStatusLink(l.id, "ignorado"))}
                  >
                    Ignorar
                  </Button>
                </div>
              </li>
            ))}
            {data.links.length === 0 ? (
              <li className="text-sm text-muted-foreground">Nenhuma sugestão gerada ainda.</li>
            ) : null}
          </ul>
        </TabsContent>

        {/* ---------------- Cluster e tags ---------------- */}
        <TabsContent value="cluster" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3">
            <p className="text-xs text-muted-foreground">
              A IA lê o texto e sugere tags e um cluster temático.
            </p>
            <Button variant="outline" size="sm" disabled={ocupado} onClick={() => void sugerirTaxonomia()}>
              <Sparkles className="size-4" /> Sugerir com IA
            </Button>
          </div>
          <div>
            <Label>Cluster SEO</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {data.clusters.map((c) => {
                const meu = data.meusClusters.find((m) => m.cluster_slug === c.slug);
                return (
                  <button
                    key={c.slug}
                    type="button"
                    onClick={() => {
                      const outros = data.meusClusters.filter((m) => m.cluster_slug !== c.slug);
                      const proximo = meu
                        ? meu.principal
                          ? outros
                          : [...outros, { cluster_slug: c.slug, principal: true }]
                        : [...outros, { cluster_slug: c.slug, principal: outros.length === 0 }];
                      void executar(() => salvarClustersDoPost(slug, proximo));
                    }}
                  >
                    <Badge variant={meu ? (meu.principal ? "default" : "secondary") : "outline"}>
                      {c.nome}
                      {meu?.principal ? " · principal" : ""}
                    </Badge>
                  </button>
                );
              })}
            </div>
            <div className="mt-3 flex gap-2">
              <Input
                placeholder="Novo cluster (ex.: Cânhamo)"
                value={novoCluster}
                onChange={(e) => setNovoCluster(e.target.value)}
              />
              <Button
                variant="outline"
                disabled={!novoCluster.trim() || ocupado}
                onClick={() =>
                  void executar(async () => {
                    await salvarCluster({
                      slug: gerarSlug(novoCluster),
                      nome: novoCluster.trim(),
                      descricao: null,
                    });
                    setNovoCluster("");
                  }, "Cluster criado.")
                }
              >
                Criar
              </Button>
            </div>
          </div>

          <div>
            <Label>Tags</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {data.tags.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() =>
                    void executar(() =>
                      salvarTagsDoPost(
                        slug,
                        data.tags.filter((x) => x !== t),
                      ),
                    )
                  }
                >
                  <Badge variant="secondary">
                    {t} <X className="ml-1 size-3" />
                  </Badge>
                </button>
              ))}
              {data.tags.length === 0 ? (
                <span className="text-xs text-muted-foreground">Sem tags.</span>
              ) : null}
            </div>
            <div className="mt-3 flex gap-2">
              <Input
                placeholder="Nova tag"
                value={novaTag}
                list="tags-existentes"
                onChange={(e) => setNovaTag(e.target.value)}
              />
              <datalist id="tags-existentes">
                {data.todasTags.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
              <Button
                variant="outline"
                disabled={!novaTag.trim() || ocupado}
                onClick={() =>
                  void executar(async () => {
                    await salvarTagsDoPost(slug, [...data.tags, novaTag]);
                    setNovaTag("");
                  })
                }
              >
                Adicionar
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </section>
  );
}

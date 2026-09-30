import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ArrowDown, ArrowUp, Pencil, Plus, Shuffle, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { LINHAS, NIVEIS, ROTULO } from "@/config/guia-perfis";
import {
  formatPrice,
  getCategoryById,
  getProduct,
  products,
  rootOf,
  searchProducts,
  type Product,
} from "@/lib/catalog";
import {
  PAPEIS,
  ROTULO_PAPEL,
  atualizarKit,
  excluirKit,
  listarKits,
  relacionadosDe,
  salvarKit,
  slugify,
  type Kit,
  type KitItem,
  type Papel,
} from "@/lib/guia-admin";
import { listarOverlaysAdmin, type OverlayAdmin } from "@/lib/produtos-admin";

export const Route = createFileRoute("/admin/_gate/guia")({
  head: () => ({
    meta: [
      { title: "Guia para iniciantes — Admin DeLaTrip" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: GuiaAdminPage,
});

type Overlays = Map<string, OverlayAdmin>;

const ARMAZENAMENTO = new Set(["cases", "case", "potes-reservatorio", "lata-estojo", "zip-lock"]);
const TRANSPORTE = new Set(["carteiras"]);

function folhaSlugs(p: Product) {
  const cat = getCategoryById(p.categoriaId);
  if (!cat) return { folha: "", raiz: "" };
  return { folha: cat.slug, raiz: rootOf(cat).slug };
}

function avisos(slug: string, ov: Overlays | undefined): string[] {
  const p = getProduct(slug);
  const o = ov?.get(slug);
  const out: string[] = [];
  if (!p) out.push("indisponível no catálogo");
  if (o?.oculto) out.push("oculto no site");
  if (o?.fora_do_guia) out.push("fora do guia");
  if (p && folhaSlugs(p).raiz === "vestuario") out.push("vestuário");
  return out;
}

function vazio(nivel: string | null = null, linha: string | null = null): Kit {
  return { slug: "", nome: "", descricao: "", nivel, linha, ordem: 0, ativo: true, itens: [] };
}

function GuiaAdminPage() {
  const [editando, setEditando] = useState<Kit | null>(null);
  const { data: overlays } = useQuery({
    queryKey: ["admin", "overlays"],
    queryFn: listarOverlaysAdmin,
    retry: false,
  });
  const { data: kits = [], isLoading } = useQuery({
    queryKey: ["admin", "guia-kits"],
    queryFn: listarKits,
  });

  return (
    <div>
      <h1 className="text-xl font-semibold">Guia para iniciantes</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Kits de acessórios por nível e linha. Ainda não aparecem no site público.
      </p>

      <Cobertura kits={kits} onNovo={(n, l) => setEditando(vazio(n, l))} />

      <Tabs defaultValue="kits" className="mt-6">
        <TabsList>
          <TabsTrigger value="kits">Kits</TabsTrigger>
          <TabsTrigger value="sugestao">Sugestão de kit</TabsTrigger>
        </TabsList>
        <TabsContent value="kits">
          <ListaKits
            kits={kits}
            carregando={isLoading}
            overlays={overlays}
            onEditar={setEditando}
          />
        </TabsContent>
        <TabsContent value="sugestao">
          <Sugestao overlays={overlays} onRevisar={setEditando} />
        </TabsContent>
      </Tabs>

      {editando && (
        <EditorKit
          kit={editando}
          total={kits.length}
          overlays={overlays}
          onFechar={() => setEditando(null)}
        />
      )}
    </div>
  );
}

function Cobertura({
  kits,
  onNovo,
}: {
  kits: Kit[];
  onNovo: (nivel: string, linha: string) => void;
}) {
  const feitos = kits.filter((k) => k.ativo && k.nivel && k.linha).length;
  const tem = (n: string, l: string) => kits.some((k) => k.ativo && k.nivel === n && k.linha === l);
  const cobertas = NIVEIS.flatMap((n) => LINHAS.map((l) => tem(n, l))).filter(Boolean).length;
  return (
    <div className="mt-6 rounded-lg border border-border bg-card p-4">
      <p className="text-sm font-medium">
        Cobertura: {cobertas} de 12 combinações com kit ativo{" "}
        <span className="text-xs text-muted-foreground">({feitos} kit(s) ativos no total)</span>
      </p>
      <div className="mt-3 overflow-x-auto">
        <table className="text-sm">
          <thead>
            <tr>
              <th />
              {LINHAS.map((l) => (
                <th key={l} className="px-2 pb-1 text-xs font-medium text-muted-foreground">
                  {ROTULO[l]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {NIVEIS.map((n) => (
              <tr key={n}>
                <td className="pr-3 text-xs font-medium">{ROTULO[n]}</td>
                {LINHAS.map((l) => {
                  const ok = tem(n, l);
                  return (
                    <td key={l} className="p-1">
                      <button
                        onClick={() => !ok && onNovo(n, l)}
                        className={`h-9 w-28 rounded text-xs ${ok ? "bg-primary/15 text-primary" : "border border-dashed border-border text-muted-foreground hover:border-primary"}`}
                      >
                        {ok ? "Kit ativo" : "+ Criar"}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ListaKits({
  kits,
  carregando,
  overlays,
  onEditar,
}: {
  kits: Kit[];
  carregando: boolean;
  overlays?: Overlays | undefined;
  onEditar: (k: Kit) => void;
}) {
  const qc = useQueryClient();
  const recarregar = () => qc.invalidateQueries({ queryKey: ["admin", "guia-kits"] });

  const mover = useMutation({
    mutationFn: async ({ i, dir }: { i: number; dir: -1 | 1 }) => {
      const lista = [...kits];
      const j = i + dir;
      if (j < 0 || j >= lista.length) return;
      [lista[i], lista[j]] = [lista[j]!, lista[i]!];
      await Promise.all(lista.map((k, ordem) => (k.id ? atualizarKit(k.id, { ordem }) : null)));
    },
    onSuccess: recarregar,
    onError: () => toast.error("Não foi possível reordenar."),
  });
  const ativar = useMutation({
    mutationFn: ({ id, ativo }: { id: string; ativo: boolean }) => atualizarKit(id, { ativo }),
    onSuccess: recarregar,
  });
  const excluir = useMutation({
    mutationFn: excluirKit,
    onSuccess: () => {
      toast.success("Kit excluído.");
      void recarregar();
    },
  });

  return (
    <div className="mt-4">
      <Button size="sm" onClick={() => onEditar(vazio())}>
        <Plus className="size-4" aria-hidden="true" />
        Novo kit
      </Button>
      <div className="mt-3 overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3">Ordem</th>
              <th className="p-3">Kit</th>
              <th className="p-3">Nível / Linha</th>
              <th className="p-3">Itens</th>
              <th className="p-3">Ativo</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {carregando && (
              <tr>
                <td colSpan={6} className="p-4 text-muted-foreground">
                  Carregando…
                </td>
              </tr>
            )}
            {!carregando && kits.length === 0 && (
              <tr>
                <td colSpan={6} className="p-4 text-muted-foreground">
                  Nenhum kit ainda. Crie um ou use a aba “Sugestão de kit”.
                </td>
              </tr>
            )}
            {kits.map((k, i) => {
              const problemas = k.itens.filter((it) => avisos(it.produto_slug, overlays).length).length;
              return (
                <tr key={k.id} className="border-b border-border/60 last:border-0">
                  <td className="p-3">
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="size-7" disabled={i === 0} onClick={() => mover.mutate({ i, dir: -1 })} aria-label="Subir">
                        <ArrowUp className="size-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="size-7" disabled={i === kits.length - 1} onClick={() => mover.mutate({ i, dir: 1 })} aria-label="Descer">
                        <ArrowDown className="size-4" />
                      </Button>
                    </div>
                  </td>
                  <td className="p-3">
                    <p className="font-medium">{k.nome}</p>
                    <p className="text-xs text-muted-foreground">{k.slug}</p>
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {k.nivel ? ROTULO[k.nivel] : "—"} / {k.linha ? ROTULO[k.linha] : "—"}
                  </td>
                  <td className="p-3">
                    {k.itens.length}
                    {problemas > 0 && (
                      <span className="ml-2 inline-flex items-center gap-1 text-xs text-destructive">
                        <AlertTriangle className="size-3" /> {problemas} com aviso
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    <Switch
                      checked={k.ativo}
                      onCheckedChange={(v) => k.id && ativar.mutate({ id: k.id, ativo: v })}
                      aria-label="Ativo"
                    />
                  </td>
                  <td className="p-3 text-right">
                    <Button size="sm" variant="ghost" onClick={() => onEditar(k)}>
                      <Pencil className="size-4" /> Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (k.id && confirm(`Excluir o kit “${k.nome}”?`)) excluir.mutate(k.id);
                      }}
                      aria-label="Excluir"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EditorKit({
  kit,
  total,
  overlays,
  onFechar,
}: {
  kit: Kit;
  total: number;
  overlays?: Overlays | undefined;
  onFechar: () => void;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState<Kit>({ ...kit, ordem: kit.id ? kit.ordem : total });
  const [termo, setTermo] = useState("");
  const resultados = useMemo(
    () => (termo.trim().length >= 2 ? searchProducts(termo, 20) : []),
    [termo],
  );

  const salvar = useMutation({
    mutationFn: () =>
      salvarKit({ ...form, slug: form.slug || slugify(form.nome), descricao: form.descricao || null }),
    onSuccess: () => {
      toast.success("Kit salvo.");
      void qc.invalidateQueries({ queryKey: ["admin", "guia-kits"] });
      onFechar();
    },
    onError: (e: Error) =>
      toast.error(e.message.includes("duplicate") ? "Já existe um kit com esse slug." : "Não foi possível salvar o kit."),
  });

  const setItens = (itens: KitItem[]) => setForm({ ...form, itens: itens.map((it, ordem) => ({ ...it, ordem })) });
  const moverItem = (i: number, dir: -1 | 1) => {
    const l = [...form.itens];
    const j = i + dir;
    if (j < 0 || j >= l.length) return;
    [l[i], l[j]] = [l[j]!, l[i]!];
    setItens(l);
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onFechar()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{kit.id ? "Editar kit" : "Novo kit"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label>Nome</Label>
            <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>Slug</Label>
            <Input
              value={form.slug}
              placeholder={slugify(form.nome) || "gerado pelo nome"}
              onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })}
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label>Descrição</Label>
            <Textarea
              rows={2}
              value={form.descricao ?? ""}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label>Nível</Label>
            <Select value={form.nivel ?? ""} onValueChange={(v) => setForm({ ...form, nivel: v })}>
              <SelectTrigger><SelectValue placeholder="Escolha" /></SelectTrigger>
              <SelectContent>
                {NIVEIS.map((n) => <SelectItem key={n} value={n}>{ROTULO[n]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Linha</Label>
            <Select value={form.linha ?? ""} onValueChange={(v) => setForm({ ...form, linha: v })}>
              <SelectTrigger><SelectValue placeholder="Escolha" /></SelectTrigger>
              <SelectContent>
                {LINHAS.map((l) => <SelectItem key={l} value={l}>{ROTULO[l]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={form.ativo} onCheckedChange={(v) => setForm({ ...form, ativo: v })} id="kit-ativo" />
            <Label htmlFor="kit-ativo">Ativo</Label>
          </div>
        </div>

        <div className="mt-4">
          <Label>Adicionar produto</Label>
          <Input value={termo} onChange={(e) => setTermo(e.target.value)} placeholder="Buscar pelo nome" className="mt-1" />
          {resultados.length > 0 && (
            <ul className="mt-1 max-h-48 overflow-y-auto rounded border border-border text-sm">
              {resultados.map((p) => {
                const ja = form.itens.some((it) => it.produto_slug === p.slug);
                return (
                  <li key={p.slug}>
                    <button
                      disabled={ja}
                      className="flex w-full justify-between px-3 py-1.5 text-left hover:bg-muted disabled:opacity-50"
                      onClick={() => {
                        setItens([...form.itens, { produto_slug: p.slug, papel: form.itens.length ? "complemento" : "principal", ordem: 0 }]);
                        setTermo("");
                      }}
                    >
                      <span>{p.nome}</span>
                      <span className="text-xs text-muted-foreground">{p.marca ?? ""}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <ul className="mt-3 space-y-2">
          {form.itens.map((it, i) => {
            const p = getProduct(it.produto_slug);
            const av = avisos(it.produto_slug, overlays);
            const preco = p ? (p.precoPromocional ?? p.preco) : null;
            return (
              <li key={it.produto_slug} className="flex flex-wrap items-center gap-2 rounded border border-border p-2 text-sm">
                <div className="flex flex-col">
                  <button onClick={() => moverItem(i, -1)} disabled={i === 0} aria-label="Subir"><ArrowUp className="size-3" /></button>
                  <button onClick={() => moverItem(i, 1)} disabled={i === form.itens.length - 1} aria-label="Descer"><ArrowDown className="size-3" /></button>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{p?.nome ?? it.produto_slug}</p>
                  <p className="text-xs text-muted-foreground">
                    {p?.marca ?? "—"}
                    {preco ? ` · ref. ${formatPrice(preco)}` : ""}
                  </p>
                  {av.length > 0 && (
                    <p className="flex items-center gap-1 text-xs text-destructive">
                      <AlertTriangle className="size-3" /> {av.join(", ")}
                    </p>
                  )}
                </div>
                <Select
                  value={it.papel}
                  onValueChange={(v) => setItens(form.itens.map((x, k) => (k === i ? { ...x, papel: v as Papel } : x)))}
                >
                  <SelectTrigger className="h-8 w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAPEIS.map((pp) => <SelectItem key={pp} value={pp}>{ROTULO_PAPEL[pp]}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button size="icon" variant="ghost" className="size-7" onClick={() => setItens(form.itens.filter((_, k) => k !== i))} aria-label="Remover">
                  <X className="size-4" />
                </Button>
              </li>
            );
          })}
        </ul>

        <DialogFooter>
          <Button variant="outline" onClick={onFechar}>Cancelar</Button>
          <Button disabled={!form.nome.trim() || salvar.isPending} onClick={() => salvar.mutate()}>
            {salvar.isPending ? "Salvando…" : "Salvar kit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Sugestao({
  overlays,
  onRevisar,
}: {
  overlays?: Overlays | undefined;
  onRevisar: (k: Kit) => void;
}) {
  const [nivel, setNivel] = useState<string>("explorador");
  const [linha, setLinha] = useState<string>("entrada");
  const [semente, setSemente] = useState(0);
  const [proposta, setProposta] = useState<KitItem[] | null>(null);
  const [gerando, setGerando] = useState(false);

  const elegiveis = useMemo(
    () =>
      products.filter((p) => {
        const o = overlays?.get(p.slug);
        return p.disponivel && !o?.oculto && !o?.fora_do_guia && folhaSlugs(p).raiz !== "vestuario";
      }),
    [overlays],
  );

  function escolher(lista: Product[], usados: Set<string>, n: number) {
    const livres = lista.filter((p) => !usados.has(p.slug));
    const pref = livres.filter((p) => overlays?.get(p.slug)?.linha === linha);
    const base = (pref.length ? pref : livres).sort(
      (a, b) => Number(b.destaque) - Number(a.destaque) || b.estoque - a.estoque,
    );
    return base.length ? base[n % Math.min(base.length, 5)] : undefined;
  }

  async function gerar(n = semente) {
    setGerando(true);
    try {
      const usados = new Set<string>();
      const itens: KitItem[] = [];
      const add = (p: Product | undefined, papel: Papel) => {
        if (!p) return;
        usados.add(p.slug);
        itens.push({ produto_slug: p.slug, papel, ordem: itens.length });
      };
      const essenciais = elegiveis.filter((p) => overlays?.get(p.slug)?.etapa === "essencial");
      const doNivel = essenciais.filter((p) => overlays?.get(p.slug)?.nivel === nivel);
      const principal = escolher(doNivel.length ? doNivel : essenciais, usados, n);
      add(principal, "principal");

      if (principal) {
        const rel = (await relacionadosDe(principal.slug))
          .map((s) => elegiveis.find((p) => p.slug === s))
          .filter((p): p is Product => !!p);
        const raizP = folhaSlugs(principal).raiz;
        const outraCat = essenciais.filter((p) => folhaSlugs(p).raiz !== raizP);
        add(rel.find((p) => !usados.has(p.slug)) ?? escolher(outraCat, usados, n), "complemento");
      }
      add(escolher(elegiveis.filter((p) => ARMAZENAMENTO.has(folhaSlugs(p).folha)), usados, n), "armazenamento");
      add(escolher(elegiveis.filter((p) => TRANSPORTE.has(folhaSlugs(p).folha)), usados, n), "transporte");
      setProposta(itens);
      if (!principal) toast.warning("Nenhum produto essencial classificado. Rode “Classificar perfis” em Produtos.");
    } finally {
      setGerando(false);
    }
  }

  return (
    <div className="mt-4 space-y-4">
      <div className="flex flex-wrap items-end gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Nível</Label>
          <Select value={nivel} onValueChange={setNivel}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>{NIVEIS.map((x) => <SelectItem key={x} value={x}>{ROTULO[x]}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Linha</Label>
          <Select value={linha} onValueChange={setLinha}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>{LINHAS.map((x) => <SelectItem key={x} value={x}>{ROTULO[x]}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <Button onClick={() => void gerar()} disabled={gerando || !overlays}>
          {gerando ? "Gerando…" : "Sugerir kit"}
        </Button>
        {proposta && (
          <Button
            variant="outline"
            onClick={() => {
              const n = semente + 1;
              setSemente(n);
              void gerar(n);
            }}
          >
            <Shuffle className="size-4" /> Outra sugestão
          </Button>
        )}
      </div>

      {proposta && (
        <div className="rounded-lg border border-border bg-card p-4">
          <ul className="space-y-2 text-sm">
            {PAPEIS.map((papel) => {
              const it = proposta.find((x) => x.papel === papel);
              const p = it ? getProduct(it.produto_slug) : undefined;
              return (
                <li key={papel} className="flex gap-3">
                  <span className="w-32 text-xs uppercase text-muted-foreground">{ROTULO_PAPEL[papel]}</span>
                  <span>{p ? `${p.nome}${p.marca ? ` · ${p.marca}` : ""}` : "Nenhum candidato encontrado"}</span>
                </li>
              );
            })}
          </ul>
          <Button
            className="mt-4"
            onClick={() =>
              onRevisar({
                ...vazio(nivel, linha),
                nome: `Kit ${ROTULO[nivel]} · ${ROTULO[linha]}`,
                itens: proposta,
              })
            }
          >
            Revisar e salvar como kit
          </Button>
        </div>
      )}
    </div>
  );
}

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ExternalLink, Save } from "lucide-react";
import { toast } from "sonner";

import { BotaoSeoIa } from "@/components/admin/BotaoSeoIa";
import { FaqEditor } from "@/components/admin/FaqEditor";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { CATEGORIAS_POST } from "@/lib/blog-core";
import {
  gerarSlug,
  obterPostAdmin,
  salvarPost,
  statusDoPost,
  type PostAdmin,
} from "@/lib/blog-admin";
import { enviarImagem, formatarTamanho } from "@/lib/media";
import { SITE_URL } from "@/lib/seo";

export const Route = createFileRoute("/admin/_gate/blog/$slug")({
  head: () => ({
    meta: [
      { title: "Editor de post — Admin DeLaTrip" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: EditorPostPage,
});

const VAZIO: PostAdmin = {
  slug: "",
  titulo: "",
  resumo: "",
  conteudo_html: "",
  capa_url: null,
  capa_alt: "",
  categoria: "Cultura",
  autor: "DeLaTrip",
  publicado: false,
  publicado_em: null,
  seo_titulo: "",
  seo_descricao: "",
  seo_keywords: "",
};

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

function paraInputLocal(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function EditorPostPage() {
  const { slug } = Route.useParams();
  const novo = slug === "novo";
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [post, setPost] = useState<PostAdmin>(VAZIO);
  const [slugOriginal, setSlugOriginal] = useState<string | null>(null);
  const [slugManual, setSlugManual] = useState(false);
  const [sujo, setSujo] = useState(false);
  const [estado, setEstado] = useState<"ocioso" | "salvando" | "salvo">("ocioso");
  const [horaSalvo, setHoraSalvo] = useState<string | null>(null);
  const [enviandoCapa, setEnviandoCapa] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "post", slug],
    queryFn: () => obterPostAdmin(slug),
    enabled: !novo,
    retry: false,
  });

  useEffect(() => {
    if (data) {
      setPost(data);
      setSlugOriginal(data.slug);
      setSlugManual(true);
      setSujo(false);
    }
  }, [data]);

  function alterar<K extends keyof PostAdmin>(chave: K, valor: PostAdmin[K]) {
    setPost((atual) => ({ ...atual, [chave]: valor }));
    setSujo(true);
  }

  function alterarTitulo(valor: string) {
    setPost((atual) => ({
      ...atual,
      titulo: valor,
      slug: slugManual ? atual.slug : gerarSlug(valor),
    }));
    setSujo(true);
  }

  const gravar = useCallback(
    async (silencioso = false) => {
      if (!post.titulo.trim()) {
        if (!silencioso) toast.error("Informe o título.");
        return false;
      }
      if (!post.slug.trim()) {
        if (!silencioso) toast.error("Informe o endereço (slug).");
        return false;
      }
      if (post.capa_url && !post.capa_alt?.trim()) {
        if (!silencioso) toast.error("O texto alternativo da capa é obrigatório.");
        return false;
      }
      setEstado("salvando");
      try {
        await salvarPost(post, slugOriginal ?? undefined);
        setSlugOriginal(post.slug);
        setSujo(false);
        setEstado("salvo");
        setHoraSalvo(
          new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        );
        void queryClient.invalidateQueries({ queryKey: ["admin", "posts"] });
        if (!silencioso) toast.success("Post salvo.");
        if (novo) navigate({ to: "/admin/blog/$slug", params: { slug: post.slug }, replace: true });
        return true;
      } catch (err) {
        setEstado("ocioso");
        if (!silencioso) {
          toast.error(err instanceof Error ? err.message : "Falha ao salvar.");
        }
        return false;
      }
    },
    [post, slugOriginal, novo, navigate, queryClient],
  );

  // Rascunho automático a cada 20 segundos quando há alteração pendente.
  const gravarRef = useRef(gravar);
  gravarRef.current = gravar;
  useEffect(() => {
    if (!sujo) return;
    const t = setInterval(() => void gravarRef.current(true), 20000);
    return () => clearInterval(t);
  }, [sujo]);

  useEffect(() => {
    function aviso(e: BeforeUnloadEvent) {
      if (!sujo) return;
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", aviso);
    return () => window.removeEventListener("beforeunload", aviso);
  }, [sujo]);

  async function enviarCapa(file: File) {
    setEnviandoCapa(true);
    try {
      const { url, tamanho } = await enviarImagem(file, post.slug || post.titulo || "capa");
      alterar("capa_url", url);
      toast.success(`Capa enviada (${formatarTamanho(tamanho)}).`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha no envio.");
    } finally {
      setEnviandoCapa(false);
    }
  }

  const avisoSlug = useMemo(
    () => !!slugOriginal && slugOriginal !== post.slug && data?.publicado,
    [slugOriginal, post.slug, data],
  );

  if (!novo && isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando post…</p>;
  }

  const status = statusDoPost(post);

  return (
    <div className="mx-auto max-w-5xl pb-16">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">{novo ? "Novo post" : "Editar post"}</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {estado === "salvando"
              ? "salvando…"
              : horaSalvo
                ? `salvo às ${horaSalvo}`
                : sujo
                  ? "alterações não salvas"
                  : "sem alterações"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate({ to: "/admin/blog" })}>
            Voltar
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              const ok = await gravar(true);
              if (ok) window.open(`/admin/blog/preview/${post.slug}`, "_blank", "noopener");
            }}
          >
            <ExternalLink className="size-4" /> Pré-visualizar
          </Button>
          <Button onClick={() => void gravar()} disabled={estado === "salvando"}>
            <Save className="size-4" /> Salvar
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-5">
          <div>
            <Label htmlFor="titulo">Título</Label>
            <Input
              id="titulo"
              value={post.titulo}
              onChange={(e) => alterarTitulo(e.target.value)}
              placeholder="Título do post (vira o H1 da página)"
            />
          </div>

          <div>
            <Label htmlFor="slug">Endereço (slug)</Label>
            <Input
              id="slug"
              value={post.slug}
              onChange={(e) => {
                setSlugManual(true);
                alterar("slug", gerarSlug(e.target.value));
              }}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {SITE_URL}/blog/{post.slug || "…"}
            </p>
            {avisoSlug ? (
              <p className="mt-2 flex items-start gap-2 rounded border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                Alterar o endereço quebra os links existentes para este post.
              </p>
            ) : null}
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="resumo">Resumo</Label>
              <Contador texto={post.resumo ?? ""} limite={200} />
            </div>
            <Textarea
              id="resumo"
              rows={3}
              value={post.resumo ?? ""}
              onChange={(e) => alterar("resumo", e.target.value)}
            />
          </div>

          <div>
            <Label>Corpo</Label>
            <RichTextEditor
              valor={post.conteudo_html ?? ""}
              onChange={(html) => alterar("conteudo_html", html)}
              baseArquivo={post.slug || "post"}
            />
          </div>

          <FaqEditor
            tipo="post"
            alvo={slugOriginal ?? post.slug}
            titulo={post.titulo}
            contexto={`${post.resumo ?? ""}\n${post.conteudo_html ?? ""}`}
            extra={post.categoria ? `Categoria: ${post.categoria}` : null}
            habilitado={!!slugOriginal}
          />

          <section className="rounded-lg border border-border bg-card p-4">
            <h2 className="text-base font-semibold">SEO</h2>
            <div className="mt-3">
              <BotaoSeoIa
                tipo="post"
                titulo={post.titulo}
                contexto={`${post.resumo ?? ""}\n${post.conteudo_html ?? ""}`}
                extra={post.categoria ? `Categoria: ${post.categoria}` : null}
                vazio={
                  !post.seo_titulo?.trim() &&
                  !post.seo_descricao?.trim() &&
                  !post.seo_keywords?.trim()
                }
                onGerado={(seo) => {
                  setPost((atual) => ({
                    ...atual,
                    seo_titulo: seo.titulo,
                    seo_descricao: seo.descricao,
                    seo_keywords: seo.keywords,
                  }));
                  setSujo(true);
                }}
              />
            </div>
            <div className="mt-3 space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="seo-titulo">Título SEO</Label>
                  <Contador texto={post.seo_titulo ?? ""} limite={60} />
                </div>
                <Input
                  id="seo-titulo"
                  value={post.seo_titulo ?? ""}
                  onChange={(e) => alterar("seo_titulo", e.target.value)}
                />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="seo-descricao">Descrição SEO</Label>
                  <Contador texto={post.seo_descricao ?? ""} limite={155} />
                </div>
                <Textarea
                  id="seo-descricao"
                  rows={2}
                  value={post.seo_descricao ?? ""}
                  onChange={(e) => alterar("seo_descricao", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="seo-keywords">Palavras-chave</Label>
                <Input
                  id="seo-keywords"
                  value={post.seo_keywords ?? ""}
                  onChange={(e) => alterar("seo_keywords", e.target.value)}
                  placeholder="termo um, termo dois, termo três"
                />
              </div>
              <div className="rounded border border-border bg-background p-3">
                <p className="text-xs text-muted-foreground">Pré-visualização no Google</p>
                <p className="mt-2 truncate text-xs text-muted-foreground">
                  {SITE_URL}/blog/{post.slug || "…"}
                </p>
                <p className="truncate text-base text-primary">
                  {post.seo_titulo || post.titulo || "Título do post"}
                </p>
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {post.seo_descricao || post.resumo || "Descrição do post."}
                </p>
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-5">
          <section className="rounded-lg border border-border bg-card p-4">
            <h2 className="text-sm font-semibold uppercase">Publicação</h2>
            <div className="mt-3 space-y-3">
              <label className="flex items-center justify-between text-sm">
                Publicado
                <Switch
                  checked={post.publicado}
                  onCheckedChange={(v) => {
                    alterar("publicado", v);
                    if (v && !post.publicado_em) {
                      alterar("publicado_em", new Date().toISOString());
                    }
                  }}
                />
              </label>
              <div>
                <Label htmlFor="data">Data de publicação</Label>
                <Input
                  id="data"
                  type="datetime-local"
                  value={paraInputLocal(post.publicado_em)}
                  onChange={(e) =>
                    alterar(
                      "publicado_em",
                      e.target.value ? new Date(e.target.value).toISOString() : null,
                    )
                  }
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Status atual: <strong>{status}</strong>. Data futura mantém o post fora
                  do site até chegar a hora.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-4">
            <h2 className="text-sm font-semibold uppercase">Classificação</h2>
            <div className="mt-3 space-y-3">
              <div>
                <Label>Categoria</Label>
                <Select
                  value={post.categoria ?? "Cultura"}
                  onValueChange={(v) => alterar("categoria", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS_POST.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="autor">Autor</Label>
                <Input
                  id="autor"
                  value={post.autor ?? ""}
                  onChange={(e) => alterar("autor", e.target.value)}
                />
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-4">
            <h2 className="text-sm font-semibold uppercase">Imagem de capa</h2>
            <div className="mt-3 space-y-3">
              {post.capa_url ? (
                <img
                  src={post.capa_url}
                  alt={post.capa_alt ?? ""}
                  className="aspect-[16/9] w-full rounded border border-border object-cover"
                />
              ) : null}
              <Input
                type="file"
                accept={ACCEPT_IMAGENS}
                disabled={enviandoCapa}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void enviarCapa(f);
                }}
              />
              <div>
                <Label htmlFor="capa-alt">Texto alternativo (obrigatório)</Label>
                <Input
                  id="capa-alt"
                  value={post.capa_alt ?? ""}
                  onChange={(e) => alterar("capa_alt", e.target.value)}
                />
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

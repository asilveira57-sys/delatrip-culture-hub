import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  carregarEpisodioAdmin,
  excluirEpisodioAdmin,
  gerarSlug,
  salvarEpisodioAdmin,
} from "@/lib/portal-admin";
import type { EpisodioPodcast } from "@/lib/portal-core";

export const Route = createFileRoute("/admin/_gate/podcast/$slug")({
  head: () => ({
    meta: [
      { title: "Episódio — Admin DeLaTrip" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: PodcastEditorPage,
});

const VAZIO: EpisodioPodcast = {
  slug: "",
  titulo: "",
  descricao: "",
  resumo: "",
  conteudo_html: "",
  capa_url: "",
  capa_alt: "",
  data_publicacao: null,
  participantes: "",
  spotify_url: "",
  youtube_url: "",
  outro_url: "",
  transcricao: "",
  duracao: "",
  publicado: false,
  seo_titulo: "",
  seo_descricao: "",
  seo_keywords: "",
  og_imagem: "",
};

function PodcastEditorPage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const novo = slug === "novo";
  const [ep, setEp] = useState<EpisodioPodcast>(VAZIO);
  const [salvando, setSalvando] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "podcast", slug],
    queryFn: () => carregarEpisodioAdmin(slug),
    enabled: !novo,
    retry: false,
  });

  useEffect(() => {
    if (data) setEp({ ...VAZIO, ...data });
  }, [data]);

  function campo<K extends keyof EpisodioPodcast>(chave: K, valor: EpisodioPodcast[K]) {
    setEp((a) => ({ ...a, [chave]: valor }));
  }

  async function salvar() {
    const slugFinal = (ep.slug || gerarSlug(ep.titulo)).trim();
    if (!ep.titulo.trim() || !slugFinal) {
      toast.error("Informe pelo menos o título.");
      return;
    }
    setSalvando(true);
    try {
      await salvarEpisodioAdmin({ ...ep, slug: slugFinal });
      toast.success("Episódio salvo.");
      if (novo || slugFinal !== slug) {
        navigate({ to: "/admin/podcast/$slug", params: { slug: slugFinal }, replace: true });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao salvar.");
    } finally {
      setSalvando(false);
    }
  }

  async function excluir() {
    if (!confirm("Excluir este episódio?")) return;
    try {
      await excluirEpisodioAdmin(slug);
      toast.success("Episódio excluído.");
      navigate({ to: "/admin/podcast" });
    } catch {
      toast.error("Falha ao excluir.");
    }
  }

  if (!novo && isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando…</p>;
  }

  return (
    <div className="mx-auto max-w-3xl pb-16">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">{novo ? "Novo episódio" : ep.titulo || slug}</h1>
        <div className="flex gap-2">
          {!novo ? (
            <Button variant="outline" onClick={() => void excluir()}>
              <Trash2 className="size-4" /> Excluir
            </Button>
          ) : null}
          <Button onClick={() => void salvar()} disabled={salvando}>
            <Save className="size-4" /> {salvando ? "Salvando…" : "Salvar"}
          </Button>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <Label>Título</Label>
          <Input value={ep.titulo} onChange={(e) => campo("titulo", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Slug</Label>
          <Input
            value={ep.slug}
            placeholder={gerarSlug(ep.titulo)}
            onChange={(e) => campo("slug", gerarSlug(e.target.value))}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Data de publicação</Label>
            <Input
              type="date"
              value={ep.data_publicacao ?? ""}
              onChange={(e) => campo("data_publicacao", e.target.value || null)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Duração</Label>
            <Input
              value={ep.duracao ?? ""}
              placeholder="Ex.: 48 min"
              onChange={(e) => campo("duracao", e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Participantes</Label>
          <Input
            value={ep.participantes ?? ""}
            onChange={(e) => campo("participantes", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Resumo</Label>
          <Textarea
            rows={3}
            value={ep.resumo ?? ""}
            onChange={(e) => campo("resumo", e.target.value)}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Capa (URL)</Label>
            <Input value={ep.capa_url ?? ""} onChange={(e) => campo("capa_url", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Texto alternativo da capa</Label>
            <Input value={ep.capa_alt ?? ""} onChange={(e) => campo("capa_alt", e.target.value)} />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Spotify</Label>
            <Input
              value={ep.spotify_url ?? ""}
              onChange={(e) => campo("spotify_url", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>YouTube</Label>
            <Input
              value={ep.youtube_url ?? ""}
              onChange={(e) => campo("youtube_url", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Outro player</Label>
            <Input
              value={ep.outro_url ?? ""}
              onChange={(e) => campo("outro_url", e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Descrição do episódio</Label>
          <RichTextEditor
            valor={ep.conteudo_html ?? ""}
            onChange={(html) => campo("conteudo_html", html)}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Transcrição</Label>
          <Textarea
            rows={6}
            value={ep.transcricao ?? ""}
            onChange={(e) => campo("transcricao", e.target.value)}
          />
        </div>

        <fieldset className="space-y-4 rounded-lg border border-border p-4">
          <legend className="px-1 text-sm font-medium">SEO</legend>
          <div className="space-y-1.5">
            <Label>Meta título</Label>
            <Input
              value={ep.seo_titulo ?? ""}
              onChange={(e) => campo("seo_titulo", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Meta descrição</Label>
            <Textarea
              rows={2}
              value={ep.seo_descricao ?? ""}
              onChange={(e) => campo("seo_descricao", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Palavras-chave</Label>
            <Input
              value={ep.seo_keywords ?? ""}
              onChange={(e) => campo("seo_keywords", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Imagem Open Graph</Label>
            <Input
              value={ep.og_imagem ?? ""}
              onChange={(e) => campo("og_imagem", e.target.value)}
            />
          </div>
        </fieldset>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={ep.publicado}
            onChange={(e) => campo("publicado", e.target.checked)}
          />
          Publicado
        </label>
      </div>
    </div>
  );
}

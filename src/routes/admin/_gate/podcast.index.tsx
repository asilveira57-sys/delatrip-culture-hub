import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { listarEpisodiosAdmin } from "@/lib/portal-admin";

export const Route = createFileRoute("/admin/_gate/podcast/")({
  head: () => ({
    meta: [
      { title: "Podcast — Admin DeLaTrip" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: PodcastIndexPage,
});

function PodcastIndexPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "podcast"],
    queryFn: listarEpisodiosAdmin,
    retry: false,
  });

  return (
    <div className="mx-auto max-w-3xl pb-16">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Podcast</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Episódios publicados aparecem em /podcast e no sitemap.
          </p>
        </div>
        <Button onClick={() => navigate({ to: "/admin/podcast/$slug", params: { slug: "novo" } })}>
          <Plus className="size-4" /> Novo episódio
        </Button>
      </div>

      {isLoading ? (
        <p className="mt-6 text-sm text-muted-foreground">Carregando…</p>
      ) : (data ?? []).length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">Nenhum episódio cadastrado.</p>
      ) : (
        <ul className="mt-6 divide-y divide-border rounded-lg border border-border bg-card">
          {(data ?? []).map((ep) => (
            <li key={ep.slug}>
              <Link
                to="/admin/podcast/$slug"
                params={{ slug: ep.slug }}
                className="flex items-center justify-between px-4 py-3 hover:bg-muted"
              >
                <span>
                  <span className="font-medium">{ep.titulo}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {ep.publicado ? "Publicado" : "Rascunho"}
                    {ep.data_publicacao
                      ? ` · ${new Date(ep.data_publicacao).toLocaleDateString("pt-BR")}`
                      : ""}
                  </span>
                </span>
                <ChevronRight className="size-4 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

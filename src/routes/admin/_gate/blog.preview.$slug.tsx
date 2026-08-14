import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { ArtigoConteudo } from "@/components/ArtigoConteudo";
import { obterPostAdmin, statusDoPost } from "@/lib/blog-admin";
import { imageForKey } from "@/lib/catalog";

export const Route = createFileRoute("/admin/_gate/blog/preview/$slug")({
  head: () => ({
    meta: [
      { title: "Pré-visualização — Admin DeLaTrip" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: PreviewPage,
});

function capa(url: string | null) {
  if (!url) return null;
  return url.startsWith("asset:") ? imageForKey(url.slice(6)) : url;
}

function PreviewPage() {
  const { slug } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "post", slug],
    queryFn: () => obterPostAdmin(slug),
    retry: false,
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Carregando…</p>;
  if (!data) return <p className="text-sm text-muted-foreground">Post não encontrado.</p>;

  const imagem = capa(data.capa_url);

  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <p className="rounded border border-gold/40 bg-gold/10 px-3 py-2 text-xs text-gold">
        Pré-visualização — status “{statusDoPost(data)}”. Esta página não é indexada.
      </p>
      <p className="eyebrow mt-6 text-primary">{data.categoria}</p>
      <h1 className="mt-2 text-3xl font-bold uppercase sm:text-4xl">{data.titulo}</h1>
      {imagem ? (
        <img
          src={imagem}
          alt={data.capa_alt ?? data.titulo}
          className="mt-8 aspect-[16/9] w-full rounded-lg border border-border bg-ink object-cover"
        />
      ) : null}
      {data.resumo ? (
        <p className="mt-8 text-lg leading-relaxed text-muted-foreground">{data.resumo}</p>
      ) : null}
      <ArtigoConteudo html={data.conteudo_html} className="mt-6" />
    </article>
  );
}

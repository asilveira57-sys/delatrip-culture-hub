import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { products } from "@/lib/catalog";
import { estatisticasEnriquecimento, formatarUsd } from "@/lib/produtos-admin";

export const Route = createFileRoute("/admin/_gate/")({
  head: () => ({
    meta: [
      { title: "Painel — Admin DeLaTrip" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: PainelPage,
});

async function carregarNumeros() {
  const agora = new Date().toISOString();
  const [overlays, ocultos, revisao, curtidas, config, posts] = await Promise.all([
    supabase.from("produto_overlay").select("slug", { count: "exact", head: true }),
    supabase
      .from("produto_overlay")
      .select("slug", { count: "exact", head: true })
      .eq("oculto", true),
    supabase
      .from("produto_overlay")
      .select("slug", { count: "exact", head: true })
      .eq("status_revisao", "pendente")
      .not("enriquecido_em", "is", null),
    supabase.from("curtida").select("id", { count: "exact", head: true }),
    supabase.from("config_site").select("valor").eq("chave", "modo_construcao").maybeSingle(),
    supabase.from("post").select("titulo, publicado, publicado_em"),
  ]);

  const linhas = posts.data ?? [];
  const publicados = linhas.filter(
    (p) => p.publicado && p.publicado_em && p.publicado_em <= agora,
  );
  const ultimo = [...publicados].sort((a, b) =>
    (b.publicado_em ?? "").localeCompare(a.publicado_em ?? ""),
  )[0];

  return {
    overlays: overlays.count ?? 0,
    ocultos: ocultos.count ?? 0,
    revisao: revisao.count ?? 0,
    curtidas: curtidas.count ?? 0,
    modoConstrucao: config.data?.valor !== false,
    posts: linhas.length,
    rascunhos: linhas.filter((p) => !p.publicado).length,
    agendados: linhas.filter((p) => p.publicado && (p.publicado_em ?? "") > agora).length,
    ultimoPost: ultimo?.titulo ?? "—",
  };
}

function Cartao({ titulo, valor }: { titulo: string; valor: string | number }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{titulo}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums">{valor}</p>
    </div>
  );
}

function PainelPage() {
  const { data: ia } = useQuery({
    queryKey: ["admin", "enriquecimento-stats"],
    queryFn: estatisticasEnriquecimento,
    retry: false,
  });
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "painel"],
    queryFn: carregarNumeros,
    retry: false,
  });

  return (
    <div>
      <h1 className="text-xl font-semibold">Painel</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Números lidos do catálogo JSON e do banco de sobreposição.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <Cartao titulo="Produtos no JSON" valor={products.length} />
        <Cartao titulo="Com sobreposição" valor={isLoading ? "…" : (data?.overlays ?? 0)} />
        <Cartao titulo="Ocultos" valor={isLoading ? "…" : (data?.ocultos ?? 0)} />
        <Cartao
          titulo="Aguardando revisão"
          valor={isLoading ? "…" : (data?.revisao ?? 0)}
        />
        <Cartao titulo="Curtidas" valor={isLoading ? "…" : (data?.curtidas ?? 0)} />
        <Cartao
          titulo="Modo construção"
          valor={isLoading ? "…" : data?.modoConstrucao ? "Ligado" : "Desligado"}
        />
      </div>

      <h2 className="mt-8 text-base font-semibold">Enriquecimento por IA</h2>
      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Cartao titulo="Textos gerados" valor={ia?.gerados ?? 0} />
        <Cartao titulo="Sem ressalvas" valor={ia?.aprovados ?? 0} />
        <Cartao titulo="Custo no mês" valor={formatarUsd(ia?.custoMes ?? 0)} />
        <Cartao titulo="Custo acumulado" valor={formatarUsd(ia?.custoTotal ?? 0)} />
      </div>

      <h2 className="mt-8 text-base font-semibold">Blog</h2>
      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Cartao titulo="Posts" valor={isLoading ? "…" : (data?.posts ?? 0)} />
        <Cartao titulo="Rascunhos" valor={isLoading ? "…" : (data?.rascunhos ?? 0)} />
        <Cartao titulo="Agendados" valor={isLoading ? "…" : (data?.agendados ?? 0)} />
        <Cartao titulo="Último publicado" valor={isLoading ? "…" : (data?.ultimoPost ?? "—")} />
      </div>
    </div>
  );
}

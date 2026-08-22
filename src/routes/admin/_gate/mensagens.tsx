import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  atualizarStatus,
  listarMensagens,
  listarSolicitacoesLgpd,
} from "@/lib/portal-admin";
import {
  CATEGORIAS_CONTATO,
  ROTULO_STATUS,
  STATUS_SOLICITACAO,
  TIPOS_LGPD,
} from "@/lib/portal-core";

export const Route = createFileRoute("/admin/_gate/mensagens")({
  head: () => ({
    meta: [
      { title: "Mensagens — Admin DeLaTrip" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: MensagensPage,
});

function rotulo(lista: readonly { valor: string; label: string }[], valor: string) {
  return lista.find((i) => i.valor === valor)?.label ?? valor;
}

function SeletorStatus({
  valor,
  onChange,
}: {
  valor: string;
  onChange: (v: string) => void;
}) {
  return (
    <select
      value={valor}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Status"
      className="rounded-md border border-border bg-background px-2 py-1 text-xs"
    >
      {STATUS_SOLICITACAO.map((s) => (
        <option key={s} value={s}>
          {ROTULO_STATUS[s]}
        </option>
      ))}
    </select>
  );
}

function MensagensPage() {
  const queryClient = useQueryClient();
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");

  const contatos = useQuery({
    queryKey: ["admin", "contatos"],
    queryFn: listarMensagens,
    retry: false,
  });
  const lgpd = useQuery({
    queryKey: ["admin", "lgpd"],
    queryFn: listarSolicitacoesLgpd,
    retry: false,
  });

  const mudarStatus = useMutation({
    mutationFn: ({
      tabela,
      id,
      status,
    }: {
      tabela: "contato_mensagem" | "lgpd_solicitacao";
      id: string;
      status: string;
    }) => atualizarStatus(tabela, id, status),
    onSuccess: (_d, v) => {
      toast.success("Status atualizado.");
      void queryClient.invalidateQueries({
        queryKey: ["admin", v.tabela === "contato_mensagem" ? "contatos" : "lgpd"],
      });
    },
    onError: () => toast.error("Não foi possível atualizar o status."),
  });

  const termo = busca.trim().toLowerCase();
  const filtrar = <T extends { nome: string; email: string; status: string }>(itens: T[]) =>
    itens.filter(
      (i) =>
        (!filtroStatus || i.status === filtroStatus) &&
        (!termo ||
          i.nome.toLowerCase().includes(termo) ||
          i.email.toLowerCase().includes(termo)),
    );

  const listaContatos = filtrar(contatos.data ?? []);
  const listaLgpd = filtrar(lgpd.data ?? []);

  return (
    <div className="mx-auto max-w-5xl pb-16">
      <h1 className="text-xl font-semibold">Mensagens e solicitações</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Contatos recebidos pelo site e pedidos de titulares de dados (LGPD).
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome ou e-mail"
          className="max-w-xs"
        />
        <select
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
          aria-label="Filtrar por status"
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="">Todos os status</option>
          {STATUS_SOLICITACAO.map((s) => (
            <option key={s} value={s}>
              {ROTULO_STATUS[s]}
            </option>
          ))}
        </select>
      </div>

      <Tabs defaultValue="contato" className="mt-6">
        <TabsList>
          <TabsTrigger value="contato">Contato ({listaContatos.length})</TabsTrigger>
          <TabsTrigger value="lgpd">LGPD ({listaLgpd.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="contato" className="mt-4 space-y-3">
          {contatos.isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          ) : listaContatos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma mensagem encontrada.</p>
          ) : (
            listaContatos.map((m) => (
              <article key={m.id} className="rounded-lg border border-border bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{m.assunto}</p>
                    <p className="text-xs text-muted-foreground">
                      {m.nome} · {m.email}
                      {m.telefone ? ` · ${m.telefone}` : ""} ·{" "}
                      {rotulo(CATEGORIAS_CONTATO, m.categoria)} ·{" "}
                      {new Date(m.created_at).toLocaleString("pt-BR")}
                    </p>
                  </div>
                  <SeletorStatus
                    valor={m.status}
                    onChange={(status) =>
                      mudarStatus.mutate({ tabela: "contato_mensagem", id: m.id, status })
                    }
                  />
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">
                  {m.mensagem}
                </p>
                {m.origem ? (
                  <p className="mt-2 text-xs text-muted-foreground/70">Origem: {m.origem}</p>
                ) : null}
              </article>
            ))
          )}
        </TabsContent>

        <TabsContent value="lgpd" className="mt-4 space-y-3">
          {lgpd.isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          ) : listaLgpd.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma solicitação encontrada.</p>
          ) : (
            listaLgpd.map((s) => (
              <article key={s.id} className="rounded-lg border border-border bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{rotulo(TIPOS_LGPD, s.tipo)}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.nome} · {s.email} ·{" "}
                      {new Date(s.created_at).toLocaleString("pt-BR")} · protocolo{" "}
                      {s.id.replace(/-/g, "").slice(0, 8).toUpperCase()}
                    </p>
                  </div>
                  <SeletorStatus
                    valor={s.status}
                    onChange={(status) =>
                      mudarStatus.mutate({ tabela: "lgpd_solicitacao", id: s.id, status })
                    }
                  />
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">
                  {s.descricao}
                </p>
              </article>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

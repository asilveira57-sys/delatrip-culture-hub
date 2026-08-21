import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";

import { Armadilha, DesafioAntiSpam, useDesafio } from "@/components/DesafioAntiSpam";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TIPOS_LGPD, lgpdSchema } from "@/lib/portal-core";
import { carregarConfigPortal, enviarSolicitacaoLgpd } from "@/lib/portal.functions";
import { absoluteUrl, breadcrumbLd, canonical, jsonLd } from "@/lib/seo";

export const Route = createFileRoute("/lgpd")({
  loader: async () => ({ config: await carregarConfigPortal() }),
  head: () => ({
    meta: [
      { title: "LGPD e seus direitos | DelaTrip" },
      {
        name: "description",
        content:
          "Exerça seus direitos como titular de dados pessoais na DelaTrip: acesso, correção, eliminação e revogação de consentimento.",
      },
      { property: "og:title", content: "LGPD e seus direitos | DelaTrip" },
      {
        property: "og:description",
        content: "Canal oficial para solicitações de titulares de dados pessoais.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: absoluteUrl("/lgpd") },
    ],
    links: [canonical("/lgpd")],
    scripts: [
      jsonLd(
        breadcrumbLd([
          { name: "Início", path: "/" },
          { name: "LGPD", path: "/lgpd" },
        ]),
      ),
    ],
  }),
  component: LgpdPage,
});

const DIREITOS = [
  "Confirmação da existência de tratamento",
  "Acesso aos dados",
  "Correção de dados incompletos ou desatualizados",
  "Informação sobre compartilhamento",
  "Eliminação de dados, quando aplicável",
  "Revogação de consentimento",
  "Oposição ao tratamento em hipóteses previstas em lei",
];

function LgpdPage() {
  const { config } = Route.useLoaderData();
  const desafio = useDesafio();
  const [armadilha, setArmadilha] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState<string | null>(null);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    nome: "",
    email: "",
    tipo: "acesso",
    descricao: "",
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const dados = { ...form, desafio: desafio.resposta, armadilha };
    const check = lgpdSchema.safeParse(dados);
    if (!check.success) {
      const mapa: Record<string, string> = {};
      for (const issue of check.error.issues) {
        mapa[String(issue.path[0])] = issue.message;
      }
      setErros(mapa);
      return;
    }
    if (!desafio.correto) {
      setErros({ desafio: "Resposta incorreta." });
      return;
    }
    setErros({});
    setEnviando(true);
    try {
      const r = await enviarSolicitacaoLgpd({ data: check.data });
      setEnviado(r.protocolo);
      setForm({ nome: "", email: "", tipo: "acesso", descricao: "" });
      desafio.sortear();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Não foi possível enviar sua solicitação.",
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Privacidade"
        titulo="LGPD e seus direitos"
        descricao="Canal oficial para solicitações relacionadas a dados pessoais."
        crumbs={[{ label: "LGPD" }]}
      />

      <div className="mx-auto grid max-w-5xl gap-12 px-4 py-14 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <h2 className="text-xl font-semibold uppercase">Seus direitos</h2>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            {DIREITOS.map((d) => (
              <li key={d} className="border-b border-border/60 pb-2">
                {d}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm text-muted-foreground">
            Responsável pelo tratamento: {config.empresa.razaoSocial} · contato{" "}
            <a
              href={`mailto:${config.lgpd.emailResponsavel}`}
              className="text-primary underline underline-offset-4"
            >
              {config.lgpd.emailResponsavel}
            </a>
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Consulte também a{" "}
            <Link
              to="/politica-de-privacidade"
              className="text-primary underline underline-offset-4"
            >
              Política de Privacidade
            </Link>
            .
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-xl font-semibold uppercase">Enviar solicitação</h2>
          {enviado ? (
            <div className="mt-4 rounded-md border border-border bg-muted/50 p-4">
              <p className="text-sm">
                Solicitação registrada. Protocolo{" "}
                <strong className="font-mono">{enviado}</strong>. Responderemos pelo
                e-mail informado.
              </p>
              <Button variant="outline" className="mt-4" onClick={() => setEnviado(null)}>
                Nova solicitação
              </Button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="relative mt-4 space-y-4">
              <Armadilha valor={armadilha} onChange={setArmadilha} />
              <div className="space-y-2">
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  value={form.nome}
                  maxLength={120}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                />
                {erros["nome"] ? (
                  <p className="text-sm text-destructive">{erros["nome"]}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  maxLength={200}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
                {erros["email"] ? (
                  <p className="text-sm text-destructive">{erros["email"]}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo de solicitação</Label>
                <select
                  id="tipo"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={form.tipo}
                  onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                >
                  {TIPOS_LGPD.map((t) => (
                    <option key={t.valor} value={t.valor}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  rows={5}
                  value={form.descricao}
                  maxLength={4000}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                />
                {erros["descricao"] ? (
                  <p className="text-sm text-destructive">{erros["descricao"]}</p>
                ) : null}
              </div>
              <DesafioAntiSpam
                pergunta={desafio.pergunta}
                resposta={desafio.resposta}
                onChange={desafio.setResposta}
                erro={erros["desafio"]}
              />
              <Button type="submit" disabled={enviando}>
                {enviando ? "Enviando…" : "Enviar solicitação"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}

import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail, MapPin, Phone, Store } from "lucide-react";
import { toast } from "sonner";

import { Armadilha, DesafioAntiSpam, useDesafio } from "@/components/DesafioAntiSpam";
import { ArtigoConteudo } from "@/components/ArtigoConteudo";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SITE } from "@/config/site";
import { rich, texto } from "@/lib/paginas-core";
import { carregarPagina } from "@/lib/paginas.functions";
import { CATEGORIAS_CONTATO, contatoSchema } from "@/lib/portal-core";
import { enviarContato } from "@/lib/portal.functions";
import { absoluteUrl, canonical, jsonLd, metaDaRota } from "@/lib/seo";

export const Route = createFileRoute("/contato")({
  loader: () => carregarPagina({ data: { caminho: "/contato" } }),
  head: ({ loaderData }) => ({
    meta: metaDaRota(loaderData?.seo, {
      titulo: "Contato — DeLaTrip",
      descricao:
        "Fale com a DeLaTrip: formulário de atendimento, e-mail, telefone, endereço e canais para lojistas e imprensa.",
      ogDescricao: "Canais de atendimento da tabacaria DeLaTrip.",
      caminho: "/contato",
    }),
    links: [canonical("/contato")],
    scripts: [
      jsonLd({
        "@context": "https://schema.org",
        "@type": "ContactPage",
        name: "Contato — DeLaTrip",
        url: absoluteUrl("/contato"),
      }),
    ],
  }),
  component: ContatoPage,
});

type Campos = {
  nome: string;
  email: string;
  telefone: string;
  categoria: string;
  assunto: string;
  mensagem: string;
};

const VAZIO: Campos = {
  nome: "",
  email: "",
  telefone: "",
  categoria: "geral",
  assunto: "",
  mensagem: "",
};

/** Coleta parâmetros UTM da URL apenas no cliente, no momento do envio. */
function utmAtuais(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  const utm: Record<string, string> = {};
  for (const chave of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]) {
    const v = params.get(chave);
    if (v) utm[chave] = v.slice(0, 120);
  }
  return utm;
}

function ContatoPage() {
  const { blocos: blocosPagina } = Route.useLoaderData();
  const introContato = rich(blocosPagina, "intro");
  const email = texto(blocosPagina, "email", SITE.email);
  const whatsapp = texto(blocosPagina, "whatsapp", SITE.telefone);
  const endereco = texto(blocosPagina, "endereco", SITE.endereco);
  const horario = texto(blocosPagina, "horario_atendimento", SITE.horarioAtendimento);

  const desafio = useDesafio();
  const [valores, setValores] = useState<Campos>(VAZIO);
  const [armadilha, setArmadilha] = useState("");
  const [consentimento, setConsentimento] = useState(false);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);
  const [protocolo, setProtocolo] = useState<string | null>(null);

  const set = (campo: keyof Campos, valor: string) => {
    setValores((v) => ({ ...v, [campo]: valor }));
    setErros((e) => {
      const { [campo]: _ignorado, ...resto } = e;
      return resto;
    });
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const entrada = {
      ...valores,
      consentimento,
      desafio: desafio.resposta,
      armadilha,
      origem: typeof window === "undefined" ? "" : window.location.pathname,
      utm: utmAtuais(),
    };
    const check = contatoSchema.safeParse(entrada);
    if (!check.success) {
      const novos: Record<string, string> = {};
      for (const issue of check.error.issues) {
        const campo = String(issue.path[0]);
        novos[campo] ??= issue.message;
      }
      setErros(novos);
      toast.error("Revise os campos destacados.");
      return;
    }
    if (!desafio.correto) {
      setErros({ desafio: "Resposta incorreta." });
      return;
    }
    setErros({});
    setEnviando(true);
    try {
      const r = await enviarContato({ data: check.data });
      setProtocolo(r.protocolo);
      setValores(VAZIO);
      setConsentimento(false);
      desafio.sortear();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Não foi possível enviar sua mensagem.",
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Fale com a gente"
        titulo={texto(blocosPagina, "titulo", "Contato")}
        descricao="Dúvidas sobre produtos, parcerias ou imprensa: envie uma mensagem ou use um dos canais diretos."
        crumbs={[{ label: "Contato" }]}
      />
      <div className="mx-auto grid max-w-5xl gap-10 px-4 py-12 lg:grid-cols-[1fr_320px]">
        <div>
          {introContato ? (
            <div className="mb-8">
              <ArtigoConteudo html={introContato} />
            </div>
          ) : null}

          {protocolo ? (
            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="text-lg font-semibold uppercase">Mensagem recebida</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Protocolo <strong className="font-mono">{protocolo}</strong>. Respondemos
                em até um dia útil.
              </p>
              <Button variant="outline" className="mt-5" onClick={() => setProtocolo(null)}>
                Enviar outra mensagem
              </Button>
            </div>
          ) : (
            <form
              onSubmit={onSubmit}
              noValidate
              className="relative rounded-lg border border-border bg-card p-6"
            >
              <h2 className="text-lg font-semibold uppercase">Envie uma mensagem</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Respondemos em até um dia útil. Campos obrigatórios.
              </p>

              <Armadilha valor={armadilha} onChange={setArmadilha} />

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <Campo
                  id="nome"
                  rotulo="Nome"
                  valor={valores.nome}
                  erro={erros["nome"]}
                  onChange={(v) => set("nome", v)}
                  maxLength={120}
                  autoComplete="name"
                />
                <Campo
                  id="email"
                  rotulo="E-mail"
                  tipo="email"
                  valor={valores.email}
                  erro={erros["email"]}
                  onChange={(v) => set("email", v)}
                  maxLength={200}
                  autoComplete="email"
                />
                <Campo
                  id="telefone"
                  rotulo="Telefone (opcional)"
                  valor={valores.telefone}
                  erro={erros["telefone"]}
                  onChange={(v) => set("telefone", v)}
                  maxLength={40}
                  autoComplete="tel"
                />
                <div>
                  <Label htmlFor="categoria">Categoria</Label>
                  <select
                    id="categoria"
                    className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={valores.categoria}
                    onChange={(e) => set("categoria", e.target.value)}
                  >
                    {CATEGORIAS_CONTATO.map((c) => (
                      <option key={c.valor} value={c.valor}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-5">
                <Campo
                  id="assunto"
                  rotulo="Assunto"
                  valor={valores.assunto}
                  erro={erros["assunto"]}
                  onChange={(v) => set("assunto", v)}
                  maxLength={160}
                />
              </div>

              <div className="mt-5">
                <Label htmlFor="mensagem">Mensagem</Label>
                <Textarea
                  id="mensagem"
                  rows={6}
                  maxLength={4000}
                  value={valores.mensagem}
                  onChange={(e) => set("mensagem", e.target.value)}
                  aria-invalid={Boolean(erros["mensagem"])}
                  className="mt-2"
                />
                <div className="mt-1 flex justify-between text-xs">
                  <span className="text-destructive">{erros["mensagem"] ?? ""}</span>
                  <span className="text-muted-foreground">
                    {valores.mensagem.length}/4000
                  </span>
                </div>
              </div>

              <div className="mt-5">
                <DesafioAntiSpam
                  pergunta={desafio.pergunta}
                  resposta={desafio.resposta}
                  onChange={desafio.setResposta}
                  erro={erros["desafio"]}
                />
              </div>

              <div className="mt-5 flex items-start gap-3">
                <Checkbox
                  id="consentimento"
                  checked={consentimento}
                  onCheckedChange={(v) => setConsentimento(v === true)}
                />
                <Label
                  htmlFor="consentimento"
                  className="text-sm font-normal leading-relaxed text-muted-foreground"
                >
                  Li e concordo com a{" "}
                  <Link
                    to="/politica-de-privacidade"
                    className="text-primary underline underline-offset-4"
                  >
                    Política de Privacidade
                  </Link>{" "}
                  e autorizo o contato para responder esta mensagem.
                </Label>
              </div>
              {erros["consentimento"] ? (
                <p className="mt-1 text-xs text-destructive">{erros["consentimento"]}</p>
              ) : null}

              <Button type="submit" disabled={enviando} className="mt-6 w-full sm:w-auto">
                {enviando ? "Enviando…" : "Enviar mensagem"}
              </Button>
            </form>
          )}
        </div>

        <aside className="space-y-4">
          <ul className="space-y-4">
            <li className="flex items-start gap-3 rounded-lg border border-border bg-card p-5">
              <Mail className="mt-0.5 size-5 text-primary" aria-hidden="true" />
              <div>
                <h2 className="font-semibold uppercase">E-mail</h2>
                <a
                  href={`mailto:${email}`}
                  className="text-sm text-primary underline underline-offset-4"
                >
                  {email}
                </a>
              </div>
            </li>
            <li className="flex items-start gap-3 rounded-lg border border-border bg-card p-5">
              <Phone className="mt-0.5 size-5 text-primary" aria-hidden="true" />
              <div>
                <h2 className="font-semibold uppercase">Telefone</h2>
                <p className="text-sm text-muted-foreground">{whatsapp}</p>
                {horario ? (
                  <p className="mt-1 text-xs text-muted-foreground">{horario}</p>
                ) : null}
              </div>
            </li>
            <li className="flex items-start gap-3 rounded-lg border border-border bg-card p-5">
              <MapPin className="mt-0.5 size-5 text-primary" aria-hidden="true" />
              <div>
                <h2 className="font-semibold uppercase">Endereço</h2>
                <p className="text-sm text-muted-foreground">{endereco}</p>
              </div>
            </li>
          </ul>

          <div className="rounded-lg border border-border bg-secondary/50 p-6">
            <Store className="size-5 text-gold" aria-hidden="true" />
            <h2 className="mt-3 text-lg font-semibold uppercase">Quer comprar?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Este portal não realiza vendas. Os pedidos são feitos na loja oficial.
            </p>
            <Button asChild className="mt-5 w-full">
              <a href={SITE.lojaOficial} target="_blank" rel="noopener noreferrer">
                Ir para a loja oficial
              </a>
            </Button>
          </div>

          <p className="text-sm text-muted-foreground">
            Solicitações sobre dados pessoais devem ser feitas em{" "}
            <Link to="/lgpd" className="text-primary underline underline-offset-4">
              LGPD e seus direitos
            </Link>
            .
          </p>
        </aside>
      </div>
    </>
  );
}

function Campo({
  id,
  rotulo,
  valor,
  erro,
  onChange,
  tipo = "text",
  maxLength,
  autoComplete,
}: {
  id: string;
  rotulo: string;
  valor: string;
  erro?: string | undefined;
  onChange: (v: string) => void;
  tipo?: string;
  maxLength?: number | undefined;
  autoComplete?: string | undefined;
}) {
  return (
    <div>
      <Label htmlFor={id}>{rotulo}</Label>
      <Input
        id={id}
        type={tipo}
        value={valor}
        maxLength={maxLength}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(erro)}
        className="mt-2"
      />
      <p className="mt-1 min-h-4 text-xs text-destructive">{erro ?? ""}</p>
    </div>
  );
}

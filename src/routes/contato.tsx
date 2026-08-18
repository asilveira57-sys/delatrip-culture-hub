import { createFileRoute, Link } from "@tanstack/react-router";

import { rich, texto } from "@/lib/paginas-core";
import { carregarPagina } from "@/lib/paginas.functions";

import { canonical, metaDaRota } from "@/lib/seo";
import { useState } from "react";
import { Mail, MapPin, Phone, Store } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { ArtigoConteudo } from "@/components/ArtigoConteudo";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SITE } from "@/config/site";

const contatoSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(2, { message: "Informe seu nome." })
    .max(100, { message: "Máximo de 100 caracteres." }),
  email: z
    .string()
    .trim()
    .email({ message: "E-mail inválido." })
    .max(255, { message: "Máximo de 255 caracteres." }),
  assunto: z
    .string()
    .trim()
    .min(3, { message: "Informe o assunto." })
    .max(120, { message: "Máximo de 120 caracteres." }),
  mensagem: z
    .string()
    .trim()
    .min(10, { message: "Escreva ao menos 10 caracteres." })
    .max(1000, { message: "Máximo de 1000 caracteres." }),
});

type Campos = z.infer<typeof contatoSchema>;
const VAZIO: Campos = { nome: "", email: "", assunto: "", mensagem: "" };

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
  }),
  component: ContatoPage,
});

function ContatoPage() {
  const { blocos: blocosPagina } = Route.useLoaderData();
  const introContato = rich(blocosPagina, "intro");
  const email = texto(blocosPagina, "email", SITE.email);
  const whatsapp = texto(blocosPagina, "whatsapp", SITE.telefone);
  const endereco = texto(blocosPagina, "endereco", SITE.endereco);
  const horario = texto(blocosPagina, "horario_atendimento", "");

  const [valores, setValores] = useState<Campos>(VAZIO);
  const [erros, setErros] = useState<Partial<Record<keyof Campos, string>>>({});

  const set = (campo: keyof Campos, valor: string) => {
    setValores((v) => ({ ...v, [campo]: valor }));
    setErros((e) => {
      const { [campo]: _removido, ...resto } = e;
      return resto;
    });
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const resultado = contatoSchema.safeParse(valores);
    if (!resultado.success) {
      const novos: Partial<Record<keyof Campos, string>> = {};
      for (const issue of resultado.error.issues) {
        const campo = issue.path[0] as keyof Campos;
        novos[campo] ??= issue.message;
      }
      setErros(novos);
      toast.error("Revise os campos destacados.");
      return;
    }

    const { nome, email, assunto, mensagem } = resultado.data;
    const corpo = `Nome: ${nome}\nE-mail: ${email}\n\n${mensagem}`;
    window.location.href = `mailto:${SITE.email}?subject=${encodeURIComponent(
      assunto,
    )}&body=${encodeURIComponent(corpo)}`;
    toast.success("Abrimos seu app de e-mail com a mensagem pronta.");
  };

  return (
    <>
      <PageHeader
        eyebrow="Fale com a gente"
        titulo={texto(blocosPagina, "titulo", "Contato")}
        descricao="Dúvidas sobre produtos, parcerias ou imprensa: envie uma mensagem ou use um dos canais diretos."
        crumbs={[{ label: "Contato" }]}
      />
      <div className="mx-auto grid max-w-5xl gap-10 px-4 py-12 lg:grid-cols-[1fr_320px]">
        <form onSubmit={onSubmit} noValidate className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-lg font-semibold uppercase">Envie uma mensagem</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Respondemos em até um dia útil. Campos obrigatórios.
          </p>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <Campo
              id="nome"
              rotulo="Nome"
              valor={valores.nome}
              erro={erros.nome}
              onChange={(v) => set("nome", v)}
              maxLength={100}
              autoComplete="name"
            />
            <Campo
              id="email"
              rotulo="E-mail"
              tipo="email"
              valor={valores.email}
              erro={erros.email}
              onChange={(v) => set("email", v)}
              maxLength={255}
              autoComplete="email"
            />
          </div>

          <div className="mt-5">
            <Campo
              id="assunto"
              rotulo="Assunto"
              valor={valores.assunto}
              erro={erros.assunto}
              onChange={(v) => set("assunto", v)}
              maxLength={120}
            />
          </div>

          <div className="mt-5">
            <Label htmlFor="mensagem">Mensagem</Label>
            <Textarea
              id="mensagem"
              rows={6}
              maxLength={1000}
              value={valores.mensagem}
              onChange={(e) => set("mensagem", e.target.value)}
              aria-invalid={Boolean(erros.mensagem)}
              aria-describedby={erros.mensagem ? "mensagem-erro" : undefined}
              className="mt-2"
            />
            <div className="mt-1 flex justify-between text-xs">
              <span id="mensagem-erro" className="text-destructive">
                {erros.mensagem ?? ""}
              </span>
              <span className="text-muted-foreground">
                {valores.mensagem.length}/1000
              </span>
            </div>
          </div>

          <Button type="submit" className="mt-6 w-full sm:w-auto">
            Enviar mensagem
          </Button>
          <p className="mt-3 text-xs text-muted-foreground">
            Ao enviar, abrimos seu aplicativo de e-mail com a mensagem pronta. Não
            armazenamos dados neste portal — veja a{" "}
            <Link to="/legal/privacidade" className="text-primary underline underline-offset-4">
              política de privacidade
            </Link>
            .
          </p>
        </form>

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
            Dúvidas rápidas costumam estar no{" "}
            <Link to="/faq" className="text-primary underline underline-offset-4">
              FAQ
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
        aria-describedby={erro ? `${id}-erro` : undefined}
        className="mt-2"
      />
      <p id={`${id}-erro`} className="mt-1 min-h-4 text-xs text-destructive">
        {erro ?? ""}
      </p>
    </div>
  );
}

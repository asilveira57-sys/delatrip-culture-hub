import { createFileRoute } from "@tanstack/react-router";
import { Mail, MapPin, Phone, Store } from "lucide-react";

import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { SITE } from "@/config/site";

export const Route = createFileRoute("/contato")({
  head: () => ({
    meta: [
      { title: "Contato — DeLaTrip" },
      {
        name: "description",
        content:
          "Fale com a DeLaTrip: e-mail, telefone, endereço e canais de atendimento especializado.",
      },
      { property: "og:title", content: "Contato — DeLaTrip" },
      { property: "og:description", content: "Canais de atendimento da tabacaria DeLaTrip." },
    ],
  }),
  component: ContatoPage,
});

function ContatoPage() {
  return (
    <>
      <PageHeader
        eyebrow="Fale com a gente"
        titulo="Contato"
        descricao="Dúvidas sobre produtos, parcerias ou imprensa: use um dos canais abaixo."
        crumbs={[{ label: "Contato" }]}
      />
      <div className="mx-auto max-w-3xl px-4 py-12">
        <ul className="space-y-4">
          <li className="flex items-start gap-3 rounded-lg border border-border bg-card p-5">
            <Mail className="mt-0.5 size-5 text-primary" aria-hidden="true" />
            <div>
              <h2 className="font-semibold uppercase">E-mail</h2>
              <a href={`mailto:${SITE.email}`} className="text-sm text-primary underline underline-offset-4">
                {SITE.email}
              </a>
            </div>
          </li>
          <li className="flex items-start gap-3 rounded-lg border border-border bg-card p-5">
            <Phone className="mt-0.5 size-5 text-primary" aria-hidden="true" />
            <div>
              <h2 className="font-semibold uppercase">Telefone</h2>
              <p className="text-sm text-muted-foreground">{SITE.telefone}</p>
            </div>
          </li>
          <li className="flex items-start gap-3 rounded-lg border border-border bg-card p-5">
            <MapPin className="mt-0.5 size-5 text-primary" aria-hidden="true" />
            <div>
              <h2 className="font-semibold uppercase">Endereço</h2>
              <p className="text-sm text-muted-foreground">{SITE.endereco}</p>
            </div>
          </li>
        </ul>

        <div className="mt-10 rounded-lg border border-border bg-secondary/50 p-6">
          <Store className="size-5 text-gold" aria-hidden="true" />
          <h2 className="mt-3 text-lg font-semibold uppercase">Quer comprar?</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Este portal não realiza vendas. Os pedidos são feitos na loja oficial.
          </p>
          <Button asChild className="mt-5">
            <a href={SITE.lojaOficial} target="_blank" rel="noopener noreferrer">
              Ir para a loja oficial
            </a>
          </Button>
        </div>
      </div>
    </>
  );
}

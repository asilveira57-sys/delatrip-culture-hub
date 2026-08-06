import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/PageHeader";
import { AVISO_SANITARIO } from "@/config/site";

export const Route = createFileRoute("/legal/aviso-legal")({
  head: () => ({
    meta: [
      { title: "Avisos legais e legislação — DeLaTrip" },
      {
        name: "description",
        content:
          "Advertência sanitária, restrição de idade e referências à legislação brasileira aplicável a produtos derivados do tabaco.",
      },
      { property: "og:title", content: "Avisos legais e legislação — DeLaTrip" },
      { property: "og:description", content: "Advertências, restrição de idade e legislação aplicável." },
    ],
  }),
  component: AvisoLegal,
});

function AvisoLegal() {
  return (
    <>
      <PageHeader
        eyebrow="Legal"
        titulo="Avisos legais"
        crumbs={[{ label: "Avisos legais" }]}
      />
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="rounded-lg border border-gold/50 bg-gold/10 p-6">
          <p className="text-sm leading-relaxed">{AVISO_SANITARIO}</p>
        </div>

        <h2 className="mt-10 text-2xl font-semibold uppercase">Restrição de idade</h2>
        <p className="mt-3 leading-relaxed text-muted-foreground">
          O acesso ao conteúdo deste portal e a aquisição dos produtos apresentados
          são permitidos exclusivamente a maiores de 18 anos.
        </p>

        <h2 className="mt-10 text-2xl font-semibold uppercase">Legislação aplicável</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed text-muted-foreground">
          <li>Lei nº 9.294/1996 — restrições à publicidade de produtos fumígenos.</li>
          <li>RDC ANVISA nº 14/2012 — regulamentação de produtos derivados do tabaco.</li>
          <li>Lei nº 8.078/1990 — Código de Defesa do Consumidor.</li>
        </ul>

        <h2 className="mt-10 text-2xl font-semibold uppercase">Natureza do portal</h2>
        <p className="mt-3 leading-relaxed text-muted-foreground">
          Este site tem caráter institucional e informativo. Não realizamos vendas,
          não exibimos preços e não processamos pedidos por aqui. As informações
          servem apenas para apresentação do catálogo e conteúdo educativo.
        </p>
      </div>
    </>
  );
}

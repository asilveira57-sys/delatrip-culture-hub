import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/PageHeader";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { SITE } from "@/config/site";

const PERGUNTAS = [
  {
    p: "Dá para comprar direto neste site?",
    r: "Não. Este portal é institucional e serve como catálogo de consulta. As compras são feitas na loja oficial ou nos marketplaces onde a DeLaTrip está presente — cada produto traz os links disponíveis.",
  },
  {
    p: "Por que alguns produtos não mostram preço?",
    r: "Preços e disponibilidade mudam com frequência. Para evitar informação desatualizada, exibimos o valor apenas nos canais de venda oficiais.",
  },
  {
    p: "Os produtos são originais?",
    r: "Sim. Trabalhamos apenas com distribuidores autorizados e importação com nota, e conferimos selos e lacres de autenticidade das marcas internacionais.",
  },
  {
    p: "Existe idade mínima?",
    r: "Sim. A venda e o uso dos produtos são estritamente proibidos para menores de 18 anos, conforme a legislação brasileira.",
  },
  {
    p: "Como funciona a troca ou a garantia?",
    r: "Trocas e garantias seguem a política do canal onde a compra foi feita (loja oficial ou marketplace). Guarde a nota fiscal e fale com o atendimento do canal em até 7 dias corridos para arrependimento.",
  },
  {
    p: "Vocês atendem lojistas e revenda?",
    r: `Sim. Enviamos condições de atacado e catálogo comercial por e-mail: escreva para ${SITE.email} com CNPJ e cidade.`,
  },
  {
    p: "Como cuidar de peças de vidro e dichavadores?",
    r: "Vidro: lave com álcool isopropílico e sal grosso, enxágue bem e seque ao ar. Dichavadores de alumínio: escove a rosca a seco e evite água, que oxida o metal.",
  },
];

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "Perguntas frequentes — DeLaTrip" },
      {
        name: "description",
        content:
          "Dúvidas sobre compras, originalidade dos produtos, idade mínima, garantia, atacado e cuidados com vidro e dichavadores.",
      },
      { property: "og:title", content: "Perguntas frequentes — DeLaTrip" },
      {
        property: "og:description",
        content: "Respostas rápidas sobre catálogo, compras, garantia e uso dos produtos.",
      },
      { property: "og:type", content: "website" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: PERGUNTAS.map((item) => ({
            "@type": "Question",
            name: item.p,
            acceptedAnswer: { "@type": "Answer", text: item.r },
          })),
        }),
      },
    ],
  }),
  component: FaqPage,
});

function FaqPage() {
  return (
    <>
      <PageHeader
        eyebrow="Ajuda"
        titulo="Perguntas frequentes"
        descricao="As dúvidas que mais chegam ao nosso atendimento, respondidas de forma direta."
        crumbs={[{ label: "FAQ" }]}
      />
      <div className="mx-auto max-w-3xl px-4 py-12">
        <Accordion type="single" collapsible className="w-full">
          {PERGUNTAS.map((item, i) => (
            <AccordionItem key={item.p} value={`item-${i}`}>
              <AccordionTrigger className="text-left text-base font-semibold">
                {item.p}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                {item.r}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="mt-12 rounded-lg border border-border bg-secondary/50 p-6">
          <h2 className="text-lg font-semibold uppercase">Não achou sua resposta?</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Nosso atendimento responde em até um dia útil.
          </p>
          <Button asChild className="mt-5">
            <a href={`mailto:${SITE.email}`}>Falar com a DeLaTrip</a>
          </Button>
        </div>
      </div>
    </>
  );
}

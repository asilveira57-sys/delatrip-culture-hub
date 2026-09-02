import { createFileRoute } from "@tanstack/react-router";

import { canonical, metaDaRota } from "@/lib/seo";

import { ArtigoConteudo } from "@/components/ArtigoConteudo";
import { PageHeader } from "@/components/PageHeader";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { SITE } from "@/config/site";
import { itensFaq, texto, type FaqItem } from "@/lib/paginas-core";
import { carregarPagina } from "@/lib/paginas.functions";

const PADRAO: FaqItem[] = [
  {
    pergunta: "Dá para comprar direto neste site?",
    resposta: "Não. Este portal é institucional e serve como catálogo de consulta. As compras são feitas na loja oficial ou nos marketplaces onde a DeLaTrip está presente — cada produto traz os links disponíveis.",
  },
  {
    pergunta: "Por que alguns produtos não mostram preço?",
    resposta: "Preços e disponibilidade mudam com frequência. Para evitar informação desatualizada, exibimos o valor apenas nos canais de venda oficiais.",
  },
  {
    pergunta: "Os produtos são originais?",
    resposta: "Sim. Trabalhamos apenas com distribuidores autorizados e importação com nota, e conferimos selos e lacres de autenticidade das marcas internacionais.",
  },
  {
    pergunta: "Existe idade mínima?",
    resposta: "Sim. A venda e o uso dos produtos são estritamente proibidos para menores de 18 anos, conforme a legislação brasileira.",
  },
  {
    pergunta: "Como funciona a troca ou a garantia?",
    resposta: "Trocas e garantias seguem a política do canal onde a compra foi feita (loja oficial ou marketplace). Guarde a nota fiscal e fale com o atendimento do canal em até 7 dias corridos para arrependimento.",
  },
  {
    pergunta: "Vocês atendem lojistas e revenda?",
    resposta: `Sim. Enviamos condições de atacado e catálogo comercial por e-mail: escreva para ${SITE.email} com CNPJ e cidade.`,
  },
  {
    pergunta: "Como cuidar de peças de vidro e dichavadores?",
    resposta: "Vidro: lave com álcool isopropílico e sal grosso, enxágue bem e seque ao ar. Dichavadores de alumínio: escove a rosca a seco e evite água, que oxida o metal.",
  },
];

export const Route = createFileRoute("/faq")({
  loader: async () => {
    const { blocos, seo } = await carregarPagina({ data: { caminho: "/faq" } });
    const itens = itensFaq(blocos);
    return { itens: itens.length > 0 ? itens : PADRAO, seo, blocos };
  },
  head: ({ loaderData }) => ({
    meta: [
      ...metaDaRota(loaderData?.seo, {
        titulo: "Perguntas frequentes — DeLaTrip",
        descricao:
          "Dúvidas sobre compras, originalidade dos produtos, idade mínima, garantia, atacado e cuidados com vidro e dichavadores.",
        ogDescricao: "Respostas rápidas sobre catálogo, compras, garantia e uso dos produtos.",
        caminho: "/faq",
      }),
      { property: "og:type", content: "website" },
    ],
    links: [canonical("/faq")],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: (loaderData?.itens ?? PADRAO).map((item) => ({
            "@type": "Question",
            name: item.pergunta,
            acceptedAnswer: {
              "@type": "Answer",
              text: item.resposta.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
            },
          })),
        }),
      },
    ],
  }),
  component: FaqPage,
});

function FaqPage() {
  const { itens, blocos } = Route.useLoaderData();

  return (
    <>
      <PageHeader
        eyebrow="Ajuda"
        titulo={texto(blocos, "titulo", "Perguntas frequentes")}
        descricao={texto(
          blocos,
          "subtitulo",
          "As dúvidas que mais chegam ao nosso atendimento, respondidas de forma direta.",
        )}
        crumbs={[{ label: "FAQ" }]}
      />
      <div className="mx-auto max-w-3xl px-4 py-12">
        <Accordion type="single" collapsible className="w-full">
          {itens.map((item, i) => (
            <AccordionItem key={item.pergunta} value={`item-${i}`}>
              <AccordionTrigger className="text-left text-base font-semibold">
                {item.pergunta}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                {/<[a-z][\s\S]*>/i.test(item.resposta) ? (
                  <ArtigoConteudo html={item.resposta} className="text-sm" />
                ) : (
                  item.resposta
                )}
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

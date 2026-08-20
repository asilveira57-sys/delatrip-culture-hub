import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ArtigoConteudo } from "@/components/ArtigoConteudo";

type Props = {
  itens: { pergunta: string; resposta: string }[];
  titulo?: string;
  className?: string;
};

/** FAQ recolhível exibida no fim de posts, produtos e páginas de marca. */
export function FaqSecao({ itens, titulo = "Perguntas frequentes", className }: Props) {
  if (!itens.length) return null;

  return (
    <section className={className}>
      <h2 className="text-lg font-semibold uppercase">{titulo}</h2>
      <Accordion type="single" collapsible className="mt-3 w-full">
        {itens.map((item, i) => (
          <AccordionItem key={`${item.pergunta}-${i}`} value={`faq-${i}`}>
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
    </section>
  );
}

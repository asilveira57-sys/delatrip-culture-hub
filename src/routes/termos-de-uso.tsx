import { createFileRoute, Link } from "@tanstack/react-router";

import { LegalLayout } from "@/components/LegalLayout";
import { carregarConfigPortal, carregarDocumentoLegal } from "@/lib/portal.functions";
import { absoluteUrl, breadcrumbLd, canonical, jsonLd } from "@/lib/seo";

export const Route = createFileRoute("/termos-de-uso")({
  loader: async () => ({
    documento: await carregarDocumentoLegal({ data: { chave: "termos" } }),
    config: await carregarConfigPortal(),
  }),
  head: () => ({
    meta: [
      { title: "Termos de Uso | DelaTrip" },
      {
        name: "description",
        content:
          "Condições de uso do portal institucional DelaTrip: finalidade informativa, propriedade intelectual, responsabilidades e conteúdo adulto.",
      },
      { property: "og:title", content: "Termos de Uso | DelaTrip" },
      {
        property: "og:description",
        content: "Regras de utilização do portal institucional DelaTrip.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: absoluteUrl("/termos-de-uso") },
    ],
    links: [canonical("/termos-de-uso")],
    scripts: [
      jsonLd(
        breadcrumbLd([
          { name: "Início", path: "/" },
          { name: "Termos de Uso", path: "/termos-de-uso" },
        ]),
      ),
    ],
  }),
  component: Termos,
});

function Termos() {
  const { documento, config } = Route.useLoaderData();

  return (
    <LegalLayout
      titulo="Termos de Uso"
      descricao="Condições para navegação e uso do conteúdo do portal."
      documento={documento}
    >
      <h2>1. Aceitação</h2>
      <p>
        Ao navegar pelo portal DelaTrip, você concorda com estes Termos de Uso e com a{" "}
        <Link
          to="/politica-de-privacidade"
          className="text-primary underline underline-offset-4"
        >
          Política de Privacidade
        </Link>
        .
      </p>

      <h2>2. Natureza do portal</h2>
      <p>
        Este é um portal institucional, informativo e cultural mantido por{" "}
        {config.empresa.razaoSocial} (CNPJ {config.empresa.cnpj}). Não há venda,
        pagamento, carrinho, checkout ou entrega neste site.
      </p>

      <h2>3. Conteúdo adulto</h2>
      <p>
        O conteúdo é destinado a maiores de 18 anos. Fumar é prejudicial à saúde. A
        RDC ANVISA nº 558/2021 proíbe a venda de produtos derivados do tabaco pela
        internet, e as informações publicadas aqui têm caráter exclusivamente
        informativo.
      </p>

      <h2>4. Propriedade intelectual</h2>
      <p>
        Textos, imagens, marcas, layout e demais elementos do portal são protegidos por
        lei. A reprodução depende de autorização prévia, ressalvada a citação com
        crédito e link para a fonte.
      </p>

      <h2>5. Uso permitido</h2>
      <ul>
        <li>consultar e compartilhar o conteúdo com atribuição;</li>
        <li>entrar em contato pelos canais oficiais;</li>
        <li>utilizar as informações para fins pessoais e informativos.</li>
      </ul>

      <h2>6. Uso proibido</h2>
      <ul>
        <li>copiar o conteúdo integralmente sem autorização;</li>
        <li>tentar acessar áreas restritas ou burlar mecanismos de segurança;</li>
        <li>enviar spam, conteúdo ilícito ou automatizado em massa;</li>
        <li>utilizar o portal para atividades vedadas pela legislação.</li>
      </ul>

      <h2>7. Links externos</h2>
      <p>
        O portal pode conter links para sites de terceiros. Não temos controle sobre
        esses conteúdos e não respondemos por suas práticas.
      </p>

      <h2>8. Limitação de responsabilidade</h2>
      <p>
        Envidamos esforços para manter as informações corretas e atualizadas, mas o
        conteúdo é fornecido no estado em que se encontra, sem garantia de
        disponibilidade ininterrupta.
      </p>

      <h2>9. Alterações</h2>
      <p>
        Estes termos podem ser alterados a qualquer momento, com efeito a partir da
        publicação nesta página.
      </p>

      <h2>10. Foro e legislação</h2>
      <p>
        Aplica-se a legislação brasileira, com foro na comarca do Rio de Janeiro — RJ,
        salvo disposição legal em contrário.
      </p>
    </LegalLayout>
  );
}

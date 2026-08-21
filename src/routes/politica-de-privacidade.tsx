import { createFileRoute, Link } from "@tanstack/react-router";

import { LegalLayout } from "@/components/LegalLayout";
import { carregarConfigPortal, carregarDocumentoLegal } from "@/lib/portal.functions";
import { carregarSeoPublico } from "@/lib/site-config.functions";
import { absoluteUrl, breadcrumbLd, canonical, jsonLd } from "@/lib/seo";

export const Route = createFileRoute("/politica-de-privacidade")({
  loader: async () => ({
    documento: await carregarDocumentoLegal({ data: { chave: "privacidade" } }),
    config: await carregarConfigPortal(),
    seo: await carregarSeoPublico(),
  }),
  head: () => ({
    meta: [
      { title: "Política de Privacidade | DelaTrip" },
      {
        name: "description",
        content:
          "Consulte a Política de Privacidade da DelaTrip e entenda como informações e dados pessoais podem ser coletados, utilizados e protegidos.",
      },
      { property: "og:title", content: "Política de Privacidade | DelaTrip" },
      {
        property: "og:description",
        content:
          "Como a DelaTrip coleta, utiliza e protege dados pessoais de visitantes do portal.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: absoluteUrl("/politica-de-privacidade") },
    ],
    links: [canonical("/politica-de-privacidade")],
    scripts: [
      jsonLd(
        breadcrumbLd([
          { name: "Início", path: "/" },
          { name: "Política de Privacidade", path: "/politica-de-privacidade" },
        ]),
      ),
    ],
  }),
  component: Privacidade,
});

function Privacidade() {
  const { documento, config, seo } = Route.useLoaderData();
  const { empresa } = config;
  const ativos = [
    seo.ga4.ativo && seo.ga4.id ? "Google Analytics" : null,
    seo.gtm.ativo && seo.gtm.id ? "Google Tag Manager" : null,
    seo.metaPixel.ativo && seo.metaPixel.id ? "Meta Pixel" : null,
  ].filter(Boolean) as string[];

  return (
    <LegalLayout
      titulo="Política de Privacidade"
      descricao="Transparência sobre o tratamento de dados no portal DelaTrip."
      documento={documento}
    >
      <h2>1. Objetivo da política</h2>
      <p>
        Esta política apresenta como a DelaTrip trata dados pessoais de visitantes e de
        pessoas que entram em contato pelo portal. O site é institucional e informativo:
        não realiza vendas, pagamentos ou entregas.
      </p>

      <h2>2. Controlador</h2>
      <p>
        {empresa.razaoSocial} — CNPJ {empresa.cnpj}. Contato:{" "}
        <a
          href={`mailto:${empresa.email}`}
          className="text-primary underline underline-offset-4"
        >
          {empresa.email}
        </a>
        .
      </p>

      <h2>3. Dados que podem ser coletados</h2>
      <ul>
        <li>nome, e-mail e telefone informados voluntariamente;</li>
        <li>endereço IP, navegador e dispositivo;</li>
        <li>páginas acessadas e origem da visita;</li>
        <li>cookies e identificadores técnicos;</li>
        <li>identificadores de analytics e de publicidade, quando autorizados.</li>
      </ul>

      <h2>4. Formas de coleta</h2>
      <ul>
        <li>formulários do portal;</li>
        <li>cookies e tecnologias semelhantes;</li>
        <li>ferramentas de analytics e pixels autorizados;</li>
        <li>logs técnicos do sistema;</li>
        <li>interações com as páginas.</li>
      </ul>

      <h2>5. Finalidades</h2>
      <ul>
        <li>atendimento de solicitações;</li>
        <li>segurança e prevenção a abusos;</li>
        <li>análise de funcionamento e estatísticas do portal;</li>
        <li>melhoria da experiência e medição de audiência;</li>
        <li>comunicação solicitada pela própria pessoa;</li>
        <li>
          marketing somente quando houver hipótese legal adequada ou consentimento
          aplicável.
        </li>
      </ul>

      <h2>6. Bases legais</h2>
      <p>
        O tratamento é realizado com apoio nas bases legais da LGPD aplicáveis a cada
        finalidade, como consentimento, legítimo interesse, cumprimento de obrigação
        legal e exercício regular de direitos. Este documento pode ser revisado
        juridicamente a qualquer momento.
      </p>

      <h2>7. Compartilhamento</h2>
      <p>
        Alguns dados podem ser processados por fornecedores de tecnologia necessários ao
        funcionamento do portal, como provedor de hospedagem, serviços de banco de dados
        e serviços de segurança.
      </p>
      {ativos.length > 0 ? (
        <p>Ferramentas de medição atualmente ativas: {ativos.join(", ")}.</p>
      ) : (
        <p>
          No momento não há ferramentas de analytics ou publicidade de terceiros ativas
          neste portal.
        </p>
      )}

      <h2>8. Armazenamento</h2>
      <p>
        Os dados são mantidos somente pelo período necessário às finalidades descritas e
        ao cumprimento de obrigações legais, sendo posteriormente eliminados ou
        anonimizados.
      </p>

      <h2>9. Segurança</h2>
      <p>
        Adotamos medidas administrativas e técnicas razoáveis, como controle de acesso à
        área administrativa, conexão criptografada e limitação de quem pode consultar as
        mensagens recebidas.
      </p>

      <h2>10. Direitos da pessoa titular</h2>
      <p>
        Você pode solicitar confirmação de tratamento, acesso, correção, informação sobre
        compartilhamento, eliminação quando aplicável, revogação de consentimento e
        oposição. Utilize a página{" "}
        <Link to="/lgpd" className="text-primary underline underline-offset-4">
          LGPD e seus direitos
        </Link>
        .
      </p>

      <h2>11. Cookies</h2>
      <p>
        O uso de cookies está detalhado na{" "}
        <Link
          to="/politica-de-cookies"
          className="text-primary underline underline-offset-4"
        >
          Política de Cookies
        </Link>
        .
      </p>

      <h2>12. Atualizações</h2>
      <p>
        Esta política pode ser atualizada. A data da última revisão é exibida ao final
        desta página.
      </p>

      <h2>13. Contato sobre privacidade</h2>
      <p>
        <a
          href={`mailto:${empresa.email}`}
          className="text-primary underline underline-offset-4"
        >
          {empresa.email}
        </a>
      </p>
    </LegalLayout>
  );
}

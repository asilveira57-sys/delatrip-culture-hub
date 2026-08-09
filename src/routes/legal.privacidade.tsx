import { createFileRoute } from "@tanstack/react-router";

import { absoluteUrl, canonical } from "@/lib/seo";

import { PageHeader } from "@/components/PageHeader";
import { SITE } from "@/config/site";

export const Route = createFileRoute("/legal/privacidade")({
  head: () => ({
    meta: [
      { title: "Política de privacidade — DeLaTrip" },
      {
        name: "description",
        content:
          "Como a DeLaTrip trata dados pessoais, cookies e direitos do titular conforme a LGPD.",
      },
      { property: "og:title", content: "Política de privacidade — DeLaTrip" },
      { property: "og:description", content: "Tratamento de dados, cookies e direitos do titular (LGPD)." },
      { property: "og:url", content: absoluteUrl("/legal/privacidade") },
    ],
    links: [canonical("/legal/privacidade")],
  }),
  component: Privacidade,
});

function Privacidade() {
  return (
    <>
      <PageHeader eyebrow="Legal" titulo="Política de privacidade" crumbs={[{ label: "Privacidade" }]} />
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h2 className="text-2xl font-semibold uppercase">Dados coletados</h2>
        <p className="mt-3 leading-relaxed text-muted-foreground">
          Este portal é informativo e não possui cadastro de usuários. Coletamos
          apenas dados de navegação agregados e anônimos para medir audiência.
        </p>

        <h2 className="mt-10 text-2xl font-semibold uppercase">Cookies</h2>
        <p className="mt-3 leading-relaxed text-muted-foreground">
          Utilizamos cookies essenciais ao funcionamento do site e, quando
          aplicável, cookies analíticos. Você pode bloqueá-los nas configurações
          do navegador.
        </p>

        <h2 className="mt-10 text-2xl font-semibold uppercase">Seus direitos (LGPD)</h2>
        <p className="mt-3 leading-relaxed text-muted-foreground">
          Você pode solicitar confirmação de tratamento, acesso, correção ou
          eliminação de dados pessoais pelo e-mail{" "}
          <a href={`mailto:${SITE.email}`} className="text-primary underline underline-offset-4">
            {SITE.email}
          </a>
          .
        </p>

        <h2 className="mt-10 text-2xl font-semibold uppercase">Links externos</h2>
        <p className="mt-3 leading-relaxed text-muted-foreground">
          Ao seguir para a loja oficial ou para marketplaces, você passa a estar
          sujeito às políticas de privacidade desses ambientes.
        </p>
      </div>
    </>
  );
}

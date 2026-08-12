import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * A página institucional da marca agora vive em /<slug-da-marca>.
 * Mantemos /marcas/<slug> como redirecionamento permanente para não quebrar
 * links antigos e indexação.
 */
export const Route = createFileRoute("/marcas/$slug")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/$brandSlug",
      params: { brandSlug: params.slug },
      statusCode: 301,
    });
  },
  component: () => null,
});

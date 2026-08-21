import { createFileRoute, redirect } from "@tanstack/react-router";

/** URL antiga — mantida como redirecionamento permanente. */
export const Route = createFileRoute("/legal/privacidade")({
  beforeLoad: () => {
    throw redirect({ to: "/politica-de-privacidade", statusCode: 301 });
  },
  component: () => null,
});

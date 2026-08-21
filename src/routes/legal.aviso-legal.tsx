import { createFileRoute, redirect } from "@tanstack/react-router";

/** URL antiga — mantida como redirecionamento permanente. */
export const Route = createFileRoute("/legal/aviso-legal")({
  beforeLoad: () => {
    throw redirect({ to: "/maiores-de-18", statusCode: 301 });
  },
  component: () => null,
});

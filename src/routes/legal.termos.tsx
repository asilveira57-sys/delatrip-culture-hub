import { createFileRoute, redirect } from "@tanstack/react-router";

/** URL antiga — mantida como redirecionamento permanente. */
export const Route = createFileRoute("/legal/termos")({
  beforeLoad: () => {
    throw redirect({ to: "/termos-de-uso", statusCode: 301 });
  },
  component: () => null,
});

import { createFileRoute, redirect } from "@tanstack/react-router";

/** URL antiga — o conteúdo institucional agora vive em /quem-somos. */
export const Route = createFileRoute("/sobre")({
  beforeLoad: () => {
    throw redirect({ to: "/quem-somos", statusCode: 301 });
  },
  component: () => null,
});

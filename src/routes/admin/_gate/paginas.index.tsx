import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

import { PAGINAS_EDITAVEIS } from "@/config/paginas-editaveis";
import { DOCUMENTOS_LEGAIS } from "@/lib/portal-admin";

export const Route = createFileRoute("/admin/_gate/paginas/")({
  head: () => ({
    meta: [
      { title: "Páginas — Admin DeLaTrip" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: PaginasPage,
});

function PaginasPage() {
  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-semibold">Páginas</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Cada página tem campos próprios. Campos em branco mantêm o conteúdo padrão do site.
      </p>
      <ul className="mt-6 divide-y divide-border rounded-lg border border-border bg-card">
        {PAGINAS_EDITAVEIS.map((p) => (
          <li key={p.id}>
            <Link
              to="/admin/paginas/$id"
              params={{ id: p.id }}
              className="flex items-center justify-between px-4 py-3 hover:bg-muted"
            >
              <span>
                <span className="font-medium">{p.nome}</span>
                <span className="ml-2 text-xs text-muted-foreground">{p.caminho}</span>
                {p.ajuda ? (
                  <span className="block text-xs text-muted-foreground">{p.ajuda}</span>
                ) : null}
              </span>
              <ChevronRight className="size-4 text-muted-foreground" />
            </Link>
          </li>
        ))}
      </ul>

      <h2 className="mt-10 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Legal e privacidade
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        O texto dessas páginas é editado na Central legal, com versão e histórico.
      </p>
      <ul className="mt-3 divide-y divide-border rounded-lg border border-border bg-card">
        {DOCUMENTOS_LEGAIS.map((d) => (
          <li key={d.chave}>
            <Link
              to="/admin/legal"
              className="flex items-center justify-between px-4 py-3 hover:bg-muted"
            >
              <span>
                <span className="font-medium">{d.nome}</span>
                <span className="ml-2 text-xs text-muted-foreground">{d.caminho}</span>
              </span>
              <ChevronRight className="size-4 text-muted-foreground" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

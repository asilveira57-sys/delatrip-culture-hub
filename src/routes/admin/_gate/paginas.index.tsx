import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

import { PAGINAS_EDITAVEIS } from "@/config/paginas-editaveis";

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
              </span>
              <ChevronRight className="size-4 text-muted-foreground" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

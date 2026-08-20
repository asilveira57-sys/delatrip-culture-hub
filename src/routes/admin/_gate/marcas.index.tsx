import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import brandsJson from "@/data/brands.json";
import { listarCaminhosEditados } from "@/lib/paginas-admin";
import { caminhoMarca } from "@/lib/marcas-core";

type MarcaJson = { nome: string; slug: string; totalProdutos: number };

export const Route = createFileRoute("/admin/_gate/marcas/")({
  head: () => ({
    meta: [
      { title: "Marcas — Admin DeLaTrip" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: MarcasAdminPage,
});

function MarcasAdminPage() {
  const [termo, setTermo] = useState("");
  const [filtro, setFiltro] = useState<"todas" | "editadas" | "padrao">("todas");

  const { data: editadas } = useQuery({
    queryKey: ["admin", "paginas", "caminhos"],
    queryFn: listarCaminhosEditados,
    retry: false,
  });

  const marcas = brandsJson as MarcaJson[];

  const lista = useMemo(() => {
    const q = termo.trim().toLowerCase();
    return marcas
      .filter((m) => !q || m.nome.toLowerCase().includes(q) || m.slug.includes(q))
      .filter((m) => {
        if (filtro === "todas") return true;
        const editada = editadas?.has(caminhoMarca(m.slug)) ?? false;
        return filtro === "editadas" ? editada : !editada;
      });
  }, [marcas, termo, filtro, editadas]);

  return (
    <div className="max-w-3xl pb-16">
      <h1 className="text-xl font-semibold">Marcas</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Cada marca tem uma página institucional em <code>/slug-da-marca</code>. Campos em branco
        mantêm o texto padrão gerado pelo site.
      </p>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative sm:max-w-xs sm:flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
            placeholder="Buscar marca"
            aria-label="Buscar marca"
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          {(["todas", "editadas", "padrao"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={
                filtro === f
                  ? "rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
                  : "rounded-md border border-border px-3 py-1.5 text-xs hover:bg-muted"
              }
            >
              {f === "todas" ? "Todas" : f === "editadas" ? "Editadas" : "Padrão"}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">{lista.length} marca(s)</p>

      <ul className="mt-3 divide-y divide-border rounded-lg border border-border bg-card">
        {lista.map((m) => {
          const editada = editadas?.has(caminhoMarca(m.slug)) ?? false;
          return (
            <li key={m.slug}>
              <Link
                to="/admin/marcas/$slug"
                params={{ slug: m.slug }}
                className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted"
              >
                <span className="min-w-0">
                  <span className="font-medium">{m.nome}</span>
                  <span className="ml-2 text-xs text-muted-foreground">/{m.slug}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    · {m.totalProdutos} produto(s)
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  <span
                    className={
                      editada
                        ? "rounded bg-primary/10 px-1.5 py-0.5 text-[10px] uppercase text-primary"
                        : "rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground"
                    }
                  >
                    {editada ? "editada" : "padrão"}
                  </span>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { BarChart3, FileText, LayoutPanelLeft, LogOut, Package, Search } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/_gate")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/admin/login" });
    return { adminUser: data.user };
  },
  head: () => ({
    meta: [
      { title: "Admin — DeLaTrip" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminLayout,
});

const ITENS = [
  { label: "Painel", to: "/admin", icon: BarChart3, ativo: true },
  { label: "SEO", to: "/admin/seo", icon: Search, ativo: true },
  { label: "Blog", to: "/admin/blog", icon: FileText, ativo: true },
  { label: "Páginas", to: "/admin/paginas", icon: LayoutPanelLeft, ativo: true },
  { label: "FAQ", to: "/admin/faq", icon: HelpCircle, ativo: true },
  { label: "Produtos", to: "#", icon: Package, ativo: false },
] as const;

function AdminLayout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function sair() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/admin/login", replace: true });
  }

  return (
    <div className="flex min-h-dvh bg-muted/30 text-foreground">
      <aside className="hidden w-56 shrink-0 flex-col border-r border-border bg-card md:flex">
        <div className="border-b border-border px-4 py-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            DeLaTrip
          </p>
          <p className="text-sm font-semibold">Administração</p>
        </div>
        <nav className="flex-1 space-y-1 p-2">
          {ITENS.map((item) =>
            item.ativo ? (
              <Link
                key={item.label}
                to={item.to}
                activeOptions={{ exact: item.to === "/admin" }}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted"
                activeProps={{ className: "bg-muted font-medium" }}
              >
                <item.icon className="size-4" aria-hidden="true" />
                {item.label}
              </Link>
            ) : (
              <span
                key={item.label}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground/60",
                )}
              >
                <item.icon className="size-4" aria-hidden="true" />
                {item.label}
                <span className="ml-auto rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase">
                  em breve
                </span>
              </span>
            ),
          )}
        </nav>
        <button
          onClick={sair}
          className="m-2 flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted"
        >
          <LogOut className="size-4" aria-hidden="true" />
          Sair
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
          <div className="flex items-center gap-3 md:hidden">
            <Link to="/admin" className="text-sm font-semibold">
              Painel
            </Link>
            <Link to="/admin/seo" className="text-sm text-muted-foreground">
              SEO
            </Link>
          </div>
          <p className="hidden text-sm text-muted-foreground md:block">
            Área privada — não indexada
          </p>
          <button
            onClick={sair}
            className="flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
          >
            <LogOut className="size-4" aria-hidden="true" />
            Sair
          </button>
        </header>
        <main className="flex-1 p-4 md:p-6">
          {/* Rotas filhas do admin renderizam aqui. */}
          <Outlet />
        </main>
      </div>
    </div>
  );
}

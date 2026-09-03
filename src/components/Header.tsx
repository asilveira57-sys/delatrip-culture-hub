import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Menu, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { SITE } from "@/config/site";
import { searchAll } from "@/lib/catalog";
import mark from "@/assets/delatrip-mark.png";

const nav = [
  { label: "Catálogo", to: "/catalogo" },
  { label: "Marcas", to: "/marcas" },
  { label: "Acessórios", to: "/acessorios" },
  { label: "Blog", to: "/blog" },
  { label: "Quem somos", to: "/quem-somos" },
  { label: "Contato", to: "/contato" },
] as const;


export function Header() {
  const [buscaAberta, setBuscaAberta] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);
  const [termo, setTermo] = useState("");
  const router = useRouter();
  const navigate = useNavigate();

  const resultados = useMemo(() => searchAll(termo), [termo]);

  const irParaBusca = (e: React.FormEvent) => {
    e.preventDefault();
    const q = termo.trim().slice(0, 100);
    if (!q) return;
    setBuscaAberta(false);
    navigate({ to: "/busca", search: { q, marca: "", ordem: "relevancia" } });
  };

  useEffect(() => {
    const unsub = router.subscribe("onResolved", () => {
      setBuscaAberta(false);
      setMenuAberto(false);
    });
    return unsub;
  }, [router]);


  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
        <Link
          to="/"
          aria-label="DeLaTrip — página inicial"
          className="flex shrink-0 items-center gap-2"
        >
          <img
            src={mark}
            alt="DeLaTrip"
            width={512}
            height={512}
            className="h-8 w-8"
          />
          <span className="font-display text-xl uppercase tracking-wide text-primary">
            DeLaTrip
          </span>
        </Link>


        <nav aria-label="Navegação principal" className="ml-4 hidden lg:block">
          <ul className="flex items-center gap-6">
            {nav.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className="text-sm font-medium text-primary/80 transition-colors hover:text-primary"
                  activeProps={{ className: "text-primary font-semibold" }}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Abrir busca"
            onClick={() => setBuscaAberta(true)}
          >
            <Search aria-hidden="true" />
          </Button>

          <Button asChild className="hidden sm:inline-flex">
            <a href={SITE.lojaOficial} target="_blank" rel="noopener noreferrer">
              Comprar na loja oficial
            </a>
          </Button>

          <Sheet open={menuAberto} onOpenChange={setMenuAberto}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Abrir menu" className="lg:hidden">
                <Menu aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[85vw] max-w-sm bg-card border-border">
              <SheetTitle className="text-primary">Menu</SheetTitle>
              <nav aria-label="Navegação mobile" className="mt-6">
                <ul className="flex flex-col gap-1">
                  {nav.map((item) => (
                    <li key={item.to}>
                      <Link
                        to={item.to}
                        className="block rounded-md px-3 py-3 text-base font-medium text-primary/80 hover:bg-accent hover:text-primary"
                        activeProps={{ className: "text-primary font-semibold" }}
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
              <Button asChild className="mt-6 w-full">
                <a href={SITE.lojaOficial} target="_blank" rel="noopener noreferrer">
                  Comprar na loja oficial
                </a>
              </Button>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <Dialog open={buscaAberta} onOpenChange={setBuscaAberta}>
        <DialogContent className="top-24 max-w-2xl translate-y-0 p-0">
          <DialogTitle className="sr-only">Buscar no catálogo</DialogTitle>
          <form
            onSubmit={irParaBusca}
            className="flex items-center gap-2 border-b border-border px-4"
          >
            <Search className="size-4 text-muted-foreground" aria-hidden="true" />
            <Input
              autoFocus
              value={termo}
              maxLength={100}
              onChange={(e) => setTermo(e.target.value)}
              placeholder="Buscar produto ou marca..."
              aria-label="Buscar produto ou marca"
              className="border-0 shadow-none focus-visible:ring-0"
            />
            {termo ? (
              <button
                type="button"
                onClick={() => setTermo("")}
                aria-label="Limpar busca"
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            ) : null}
            <button type="submit" className="sr-only">
              Buscar
            </button>
          </form>


          <div className="max-h-[60vh] overflow-y-auto p-2">
            {!termo ? (
              <p className="p-4 text-sm text-muted-foreground">
                Digite o nome de um produto ou marca.
              </p>
            ) : resultados.produtos.length === 0 && resultados.marcas.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">
                Nenhum resultado para “{termo}”.
              </p>
            ) : (
              <>
                {resultados.marcas.length > 0 && (
                  <>
                    <p className="eyebrow px-3 pt-2 text-muted-foreground">Marcas</p>
                    {resultados.marcas.map((m) => (
                      <Link
                        key={m.slug}
                        to="/marcas/$slug"
                        params={{ slug: m.slug }}
                        className="block rounded-md px-3 py-2 text-sm hover:bg-accent"
                      >
                        {m.nome}
                      </Link>
                    ))}
                  </>
                )}
                {resultados.produtos.length > 0 && (
                  <>
                    <p className="eyebrow px-3 pt-3 text-muted-foreground">Produtos</p>
                    {resultados.produtos.map((p) => (
                      <Link
                        key={p.slug}
                        to="/produto/$slug"
                        params={{ slug: p.slug }}
                        className="block rounded-md px-3 py-2 hover:bg-accent"
                      >
                        <span className="block text-sm font-medium">{p.nome}</span>
                        <span className="block text-xs text-muted-foreground">
                          {p.marca}
                        </span>
                      </Link>
                    ))}
                  </>
                )}
              </>
            )}
          </div>

          {termo.trim() ? (
            <div className="border-t border-border p-2">
              <Link
                to="/busca"
                search={{ q: termo.trim().slice(0, 100), marca: "", ordem: "relevancia" }}
                className="block rounded-md px-3 py-2 text-sm font-medium text-primary hover:bg-accent"
              >
                Ver todos os resultados para “{termo.trim()}”
              </Link>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </header>
  );
}

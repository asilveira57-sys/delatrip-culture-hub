import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, Youtube } from "lucide-react";

import { AVISO_SANITARIO, SITE } from "@/config/site";
import { categories } from "@/lib/catalog";
import logo from "@/assets/delatrip-logo.png";

export function Footer() {
  return (
    <footer className="surface-ink border-t border-ink-border">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <img
              src={logo}
              alt="DeLaTrip"
              loading="lazy"
              width={1536}
              height={512}
              className="h-8 w-auto brightness-0 invert"
            />
            <p className="mt-4 text-sm leading-relaxed text-ink-muted">
              Portal institucional e catálogo da tabacaria DeLaTrip.
            </p>
            <div className="mt-5 flex gap-3">
              <a href={SITE.redes.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram da DeLaTrip" className="text-ink-muted hover:text-gold">
                <Instagram className="size-5" aria-hidden="true" />
              </a>
              <a href={SITE.redes.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook da DeLaTrip" className="text-ink-muted hover:text-gold">
                <Facebook className="size-5" aria-hidden="true" />
              </a>
              <a href={SITE.redes.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube da DeLaTrip" className="text-ink-muted hover:text-gold">
                <Youtube className="size-5" aria-hidden="true" />
              </a>
            </div>
          </div>

          <nav aria-label="Categorias">
            <h2 className="eyebrow text-gold">Catálogo</h2>
            <ul className="mt-4 space-y-2">
              {categories.slice(0, 6).map((c) => (
                <li key={c.slug}>
                  <Link
                    to="/catalogo/$"
                    params={{ _splat: c.slug }}
                    className="text-sm text-ink-muted hover:text-gold"
                  >
                    {c.nome}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Institucional">
            <h2 className="eyebrow text-gold">Institucional</h2>
            <ul className="mt-4 space-y-2">
              <li><Link to="/sobre" className="text-sm text-ink-muted hover:text-gold">Sobre a DeLaTrip</Link></li>
              <li><Link to="/marcas" className="text-sm text-ink-muted hover:text-gold">Marcas</Link></li>
              <li><Link to="/blog" className="text-sm text-ink-muted hover:text-gold">Blog</Link></li>
              <li><Link to="/contato" className="text-sm text-ink-muted hover:text-gold">Contato</Link></li>
              <li><Link to="/legal/aviso-legal" className="text-sm text-ink-muted hover:text-gold">Avisos legais</Link></li>
              <li><Link to="/legal/privacidade" className="text-sm text-ink-muted hover:text-gold">Privacidade</Link></li>
              <li><Link to="/legal/termos" className="text-sm text-ink-muted hover:text-gold">Termos de uso</Link></li>
            </ul>
          </nav>

          <div>
            <h2 className="eyebrow text-gold">Contato</h2>
            <address className="mt-4 space-y-2 text-sm not-italic text-ink-muted">
              <p>{SITE.endereco}</p>
              <p>
                <a href={`mailto:${SITE.email}`} className="hover:text-gold">{SITE.email}</a>
              </p>
              <p>{SITE.telefone}</p>
              <p>CNPJ {SITE.cnpj}</p>
            </address>
          </div>
        </div>

        <div className="mt-12 rounded-lg border border-gold/40 bg-gold/10 p-5">
          <h2 className="eyebrow text-gold">Advertência</h2>
          <p className="mt-2 text-xs leading-relaxed text-ink-muted">{AVISO_SANITARIO}</p>
        </div>

        <p className="mt-8 text-xs text-ink-muted">
          © {new Date().getFullYear()} DeLaTrip. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}

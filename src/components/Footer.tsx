import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, Youtube } from "lucide-react";

import { AVISO_SANITARIO, SITE } from "@/config/site";
import { abrirPreferenciasCookies } from "@/lib/consentimento";
import { categories } from "@/lib/catalog";
import mark from "@/assets/delatrip-mark.png";

export function Footer() {
  return (
    <footer className="surface-ink border-t border-ink-border">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <img
              src={mark}
              alt="DeLaTrip"
              loading="lazy"
              width={512}
              height={512}
              className="h-10 w-10"
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

          <nav aria-label="Institucional e conteúdo">
            <h2 className="eyebrow text-gold">Institucional</h2>
            <ul className="mt-4 space-y-2">
              <li><Link to="/quem-somos" className="text-sm text-ink-muted hover:text-gold">Quem somos</Link></li>
              <li><Link to="/marcas" className="text-sm text-ink-muted hover:text-gold">Marcas</Link></li>
              <li><Link to="/blog" className="text-sm text-ink-muted hover:text-gold">Blog</Link></li>
              <li><Link to="/podcast" className="text-sm text-ink-muted hover:text-gold">Podcast</Link></li>
              <li><Link to="/conteudo/tabaco" className="text-sm text-ink-muted hover:text-gold">Conteúdo: tabaco</Link></li>
              <li><Link to="/faq" className="text-sm text-ink-muted hover:text-gold">Perguntas frequentes</Link></li>
              <li><Link to="/contato" className="text-sm text-ink-muted hover:text-gold">Contato</Link></li>
            </ul>
          </nav>

          <div>
            <nav aria-label="Legal e privacidade">
              <h2 className="eyebrow text-gold">Legal e privacidade</h2>
              <ul className="mt-4 space-y-2">
                <li><Link to="/politica-de-privacidade" className="text-sm text-ink-muted hover:text-gold">Política de Privacidade</Link></li>
                <li><Link to="/politica-de-cookies" className="text-sm text-ink-muted hover:text-gold">Política de Cookies</Link></li>
                <li><Link to="/lgpd" className="text-sm text-ink-muted hover:text-gold">LGPD e seus direitos</Link></li>
                <li><Link to="/termos-de-uso" className="text-sm text-ink-muted hover:text-gold">Termos de Uso</Link></li>
                <li><Link to="/maiores-de-18" className="text-sm text-ink-muted hover:text-gold">Maiores de 18 anos</Link></li>
                <li>
                  <button
                    type="button"
                    onClick={() => abrirPreferenciasCookies()}
                    className="text-sm text-ink-muted underline-offset-4 hover:text-gold hover:underline"
                  >
                    Preferências de Cookies
                  </button>
                </li>
              </ul>
            </nav>

            <h2 className="eyebrow mt-8 text-gold">Contato</h2>
            <address className="mt-4 space-y-2 text-sm not-italic text-ink-muted">
              <p>{SITE.endereco}</p>
              <p>
                <a href={`mailto:${SITE.email}`} className="hover:text-gold">{SITE.email}</a>
              </p>
              <p>{SITE.telefone}</p>
              <p>{SITE.razaoSocial}</p>
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

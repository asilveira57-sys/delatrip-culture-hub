import { createFileRoute, Link } from "@tanstack/react-router";

import { absoluteUrl, canonical } from "@/lib/seo";
import { ArrowRight, BadgeCheck, Headphones, ShieldAlert, Truck } from "lucide-react";

import { BrandChip } from "@/components/BrandCard";
import { CategoryCard } from "@/components/CategoryCard";
import { PostCard } from "@/components/PostCard";
import { ProductCard } from "@/components/ProductCard";
import { SectionHeading } from "@/components/SectionHeading";
import { Button } from "@/components/ui/button";
import { SITE } from "@/config/site";
import { brands, destaques, posts, rootCategories } from "@/lib/catalog";
import heroImg from "@/assets/hero.jpg";
import logo from "@/assets/delatrip-logo.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DeLaTrip — Tabacaria e head shop brasileira" },
      {
        name: "description",
        content:
          "Catálogo, marcas e conteúdo sobre sedas, dichavadores, bongs, bandejas e tabacos. A cultura da tabacaria brasileira em um só lugar.",
      },
      { property: "og:title", content: "DeLaTrip — Tabacaria e head shop brasileira" },
      {
        property: "og:description",
        content:
          "Catálogo, marcas e conteúdo sobre sedas, dichavadores, bongs, bandejas e tabacos.",
      },
      { property: "og:url", content: absoluteUrl("/") },
    ],
    links: [canonical("/")],
  }),
  component: Home,
});

const confianca = [
  { icone: BadgeCheck, titulo: "Produtos originais", texto: "Trabalhamos apenas com marcas oficiais e distribuidores autorizados." },
  { icone: Headphones, titulo: "Atendimento especializado", texto: "Time que conhece o segmento e ajuda você a escolher." },
  { icone: Truck, titulo: "Envio para todo o Brasil", texto: "Pedidos feitos na loja oficial chegam em todo o território nacional." },
  { icone: ShieldAlert, titulo: "Proibido para menores de 18 anos", texto: "Conteúdo e produtos destinados exclusivamente a maiores de idade." },
];

function Home() {
  return (
    <>
      {/* Hero */}
      <section className="relative isolate flex min-h-[88svh] items-center overflow-hidden surface-ink">
        <img
          src={heroImg}
          alt="Balcão de tabacaria com sedas, piteiras de vidro e fumaça roxa"
          width={1920}
          height={1088}
          className="absolute inset-0 -z-10 size-full object-cover opacity-50"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/80 to-ink/40" />

        <div className="mx-auto w-full max-w-6xl px-4 py-24">
          <img
            src={logo}
            alt="DeLaTrip"
            loading="lazy"
            width={1536}
            height={512}
            className="h-14 w-auto brightness-0 invert sm:h-20"
          />
          <h1 className="mt-8 max-w-3xl text-4xl font-bold uppercase leading-[1.05] text-ink-foreground sm:text-6xl lg:text-7xl">
            A cultura, os produtos e o conhecimento da tabacaria brasileira
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-ink-muted">
            Um catálogo curado de sedas, dichavadores, vidros e acessórios — com
            conteúdo para quem leva o segmento a sério.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link to="/catalogo">
                Ver catálogo
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="goldOutline">
              <Link to="/marcas">Conhecer as marcas</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Categorias */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <SectionHeading
          eyebrow="Navegue por tipo"
          titulo="Categorias"
          descricao="Do papel ao vidro: tudo que compõe o balcão de uma tabacaria completa."
        />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {rootCategories.map((c) => (
            <CategoryCard key={c.id} categoria={c} />
          ))}
        </div>
      </section>

      {/* Marcas */}
      <section className="surface-ink py-20">
        <div className="mx-auto max-w-6xl px-4">
          <SectionHeading
            onInk
            eyebrow="Curadoria"
            titulo="Marcas que trabalhamos"
            descricao="Clássicos internacionais e produção nacional de alto padrão."
            acao={
              <Button asChild variant="onInk">
                <Link to="/marcas">
                  Ver todas
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            }
          />
        </div>
        <div className="flex gap-4 overflow-x-auto px-4 pb-4 [scrollbar-width:thin] sm:px-[max(1rem,calc((100%-72rem)/2))]">
          {brands.map((b) => (
            <BrandChip key={b.slug} marca={b} />
          ))}
        </div>
      </section>

      {/* Destaques */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <SectionHeading
          eyebrow="Seleção da casa"
          titulo="Destaques do catálogo"
          descricao="Itens que saem do balcão com mais frequência."
          acao={
            <Button asChild variant="outline">
              <Link to="/catalogo">Ver catálogo completo</Link>
            </Button>
          }
        />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {destaques.slice(0, 8).map((p) => (
            <ProductCard key={p.slug} produto={p} />
          ))}
        </div>
      </section>

      {/* Editorial */}
      <section className="bg-secondary/50 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <SectionHeading
            eyebrow="Conteúdo"
            titulo="Aprenda sobre o segmento"
            descricao="Guias, comparativos e manutenção escritos por quem vive a tabacaria."
            acao={
              <Button asChild variant="outline">
                <Link to="/blog">Ir para o blog</Link>
              </Button>
            }
          />
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {posts.slice(0, 3).map((p) => (
              <PostCard key={p.slug} post={p} />
            ))}
          </div>
        </div>
      </section>

      {/* Confiança */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {confianca.map(({ icone: Icone, titulo, texto }) => (
            <div key={titulo} className="rounded-lg border border-border bg-card p-5">
              <Icone className="size-5 text-gold" aria-hidden="true" />
              <h3 className="mt-4 text-base font-semibold uppercase">{titulo}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {texto}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-10 text-center text-sm text-muted-foreground">
          Este portal é institucional. As compras acontecem na{" "}
          <a
            href={SITE.lojaOficial}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary underline underline-offset-4"
          >
            loja oficial DeLaTrip
          </a>
          .
        </p>
      </section>
    </>
  );
}

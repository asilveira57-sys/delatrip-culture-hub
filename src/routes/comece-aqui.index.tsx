import { useMemo, useState } from "react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Copy, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { ArtigoConteudo } from "@/components/ArtigoConteudo";
import { ConteudosRelacionados } from "@/components/ConteudosRelacionados";
import { FaqSecao } from "@/components/FaqSecao";
import { ProductCard } from "@/components/ProductCard";
import { SectionHeading } from "@/components/SectionHeading";
import { ConjuntoGuia } from "@/components/guia/ConjuntoGuia";
import { QuizGuia } from "@/components/guia/QuizGuia";
import { Button } from "@/components/ui/button";
import { NIVEIS } from "@/config/guia-perfis";
import { categories, categoryPath } from "@/lib/catalog";
import {
  PERFIS,
  ROTULO_LINHA_PUBLICA,
  depoisExplore,
  listarKitsAtivos,
  montarConjunto,
} from "@/lib/guia-publico";
import { listarPostsDoGuia } from "@/lib/guia-publico.functions";
import { useOverlays } from "@/lib/overlay";
import { lista, rich, texto } from "@/lib/paginas-core";
import { carregarPagina } from "@/lib/paginas.functions";
import { canonical, jsonLd, metaDaRota } from "@/lib/seo";

const buscaSchema = z.object({
  nivel: z.enum(["explorador", "familiarizado", "entusiasta", "especialista"]).optional().catch(undefined),
  linha: z.enum(["entrada", "normal", "premium"]).optional().catch(undefined),
  foco: z.enum(["kit", "melhorar", "organizar", "presente"]).optional().catch(undefined),
  peso: z.enum(["praticidade", "durabilidade", "visual"]).optional().catch(undefined),
  formato: z.enum(["1-14", "king-size", "cone", "nao-sei"]).optional().catch(undefined),
});

export const FAQ_PADRAO = [
  {
    pergunta: "Qual a diferença entre seda 1 1/4 e king size?",
    resposta:
      "A diferença é o comprimento e a largura do papel. A 1 1/4 é mais curta e compacta; a king size é mais longa. Os dois formatos usam o mesmo tipo de papel.",
  },
  {
    pergunta: "Piteira e filtro são a mesma coisa?",
    resposta:
      "Não. A piteira de papel dá firmeza ao formato e é descartável; os filtros variam de material e tamanho. Ambos ficam na ponta do enrolado.",
  },
  {
    pergunta: "Dichavador de metal ou de acrílico?",
    resposta:
      "Metal e alumínio duram mais e mantêm os dentes afiados. Acrílico e plástico são leves e mais em conta, bons para começar.",
  },
  {
    pergunta: "Preciso de bandeja?",
    resposta:
      "Não é obrigatória, mas ajuda a manter os itens organizados em um só lugar e facilita a limpeza.",
  },
  {
    pergunta: "Onde compro os itens do meu conjunto?",
    resposta:
      "Cada produto tem os botões para a loja oficial DeLaTrip e para a nossa loja oficial no Mercado Livre.",
  },
];

const BASICO = [
  { titulo: "Sedas", slug: "sedas", texto: "Tamanhos mais comuns: 1 1/4 (compacta), king size (longa), slim (mais fina) e cone (já moldada)." },
  { titulo: "Piteiras e filtros", slug: "piteirasfiltros", texto: "Dão firmeza ao formato. Podem ser de papel, descartáveis, ou de vidro, reutilizáveis." },
  { titulo: "Dichavadores", slug: "dichavadores", texto: "Plástico é leve e simples; alumínio e metal duram mais e têm corte mais uniforme." },
  { titulo: "Bandejas", slug: "bandejas", texto: "Mantêm tudo em um só lugar. Metal é fácil de limpar; madeira e bambu têm visual natural." },
  { titulo: "Isqueiros", slug: "gas-isqueiro-macarico", texto: "Recarregáveis duram mais. O gás e o fluido certos prolongam a vida útil do isqueiro." },
  { titulo: "Armazenamento", slug: "acessorios", texto: "Cases, potes e carteiras protegem os itens e deixam tudo pronto para levar." },
];

export const Route = createFileRoute("/comece-aqui/")({
  validateSearch: buscaSchema,
  loader: () => carregarPagina({ data: { caminho: "/comece-aqui" } }),
  head: ({ loaderData, match }) => {
    const s = match.search as z.infer<typeof buscaSchema>;
    const variacao = !!(s.nivel || s.linha || s.foco || s.peso || s.formato);
    const faq = lista(loaderData?.blocos, "faq", FAQ_PADRAO).filter((f) => f.pergunta);
    return {
      meta: [
        ...metaDaRota(loaderData?.seo, {
          titulo: "Guia de acessórios para iniciantes | DeLaTrip",
          descricao:
            "Entenda sedas, piteiras, dichavadores, bandejas e armazenamento, descubra seu perfil em 5 perguntas e monte o seu kit.",
          caminho: "/comece-aqui",
        }),
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary" },
        ...(variacao ? [{ name: "robots", content: "noindex, follow" }] : []),
      ],
      links: [canonical("/comece-aqui")],
      scripts: [
        jsonLd({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faq.map((f) => ({
            "@type": "Question",
            name: f.pergunta,
            acceptedAnswer: { "@type": "Answer", text: f.resposta },
          })),
        }),
      ],
    };
  },
  component: ComeceAqui,
});

function ComeceAqui() {
  const { blocos } = Route.useLoaderData();
  const busca = Route.useSearch();
  const intro = rich(blocos, "intro");
  const faq = lista(blocos, "faq", FAQ_PADRAO).filter((f) => f.pergunta);
  const { data: postsGuia = [] } = useQuery({
    queryKey: ["posts-guia"],
    queryFn: () => listarPostsDoGuia(),
    staleTime: 5 * 60 * 1000,
  });

  const postDoCard = (titulo: string) => {
    const chave = titulo.split(" ")[0]!.toLowerCase().slice(0, 6);
    return postsGuia.find((p) => p.titulo.toLowerCase().includes(chave));
  };

  return (
    <>
      <section className="surface-ink">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
          <p className="eyebrow text-gold">Comece aqui</p>
          <h1 className="mt-2 max-w-3xl text-4xl font-bold uppercase text-ink-foreground sm:text-6xl">
            {texto(blocos, "titulo", "Guia de acessórios para iniciantes")}
          </h1>
          <p className="mt-4 max-w-2xl text-base text-ink-muted">
            {texto(blocos, "subtitulo", "Entenda os itens, as diferenças e monte o seu kit")}
          </p>
          <Button asChild size="lg" className="mt-8">
            <a href="#quiz">{texto(blocos, "cta", "Descobrir meu perfil")}</a>
          </Button>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
        {intro ? <ArtigoConteudo html={intro} className="mb-12 max-w-3xl" /> : null}

        <SectionHeading eyebrow="Primeiros passos" titulo="O básico em 5 minutos" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BASICO.map((b) => {
            const cat = categories.find((c) => !c.paiId && c.slug === b.slug);
            const post = postDoCard(b.titulo);
            return (
              <article key={b.titulo} className="flex flex-col rounded-lg border border-border bg-card p-5">
                <h3 className="text-lg font-semibold uppercase">{b.titulo}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{b.texto}</p>
                <div className="mt-4 flex flex-wrap gap-3 text-sm">
                  {cat ? (
                    <Link to="/catalogo/$" params={{ _splat: categoryPath(cat) }} className="font-semibold text-primary hover:underline">
                      Ver no catálogo
                    </Link>
                  ) : (
                    <Link to="/catalogo" className="font-semibold text-primary hover:underline">Ver no catálogo</Link>
                  )}
                  {post && (
                    <Link to="/blog/$slug" params={{ slug: post.slug }} className="text-muted-foreground hover:text-primary hover:underline">
                      Ler o guia
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-20">
          <SectionHeading eyebrow="Perfis" titulo="Os 4 perfis" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {NIVEIS.map((n) => (
              <Link
                key={n}
                to="/comece-aqui/$nivel"
                params={{ nivel: n }}
                className="card-lift rounded-lg border border-border bg-card p-5"
              >
                <h3 className="text-lg font-semibold uppercase text-primary">{PERFIS[n].nome}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{PERFIS[n].frase}</p>
              </Link>
            ))}
          </div>
        </div>

        <div id="quiz" className="mt-20 scroll-mt-24">
          <SectionHeading eyebrow="Quiz" titulo="Descubra seu perfil" />
          <div className="mx-auto max-w-xl">
            <QuizGuia />
          </div>
        </div>

        {busca.nivel && busca.linha ? <Resultado /> : null}

        <FaqSecao itens={faq} className="mt-20 max-w-3xl" />
        <ConteudosRelacionados slugPost="comece-aqui" posts={postsGuia.slice(0, 6)} titulo="Leia também" className="mt-16" />
      </div>
    </>
  );
}

function Resultado() {
  const busca = Route.useSearch();
  const navigate = useNavigate();
  const overlays = useOverlays();
  const [copiado, setCopiado] = useState(false);
  const { data: kits, isLoading } = useQuery({ queryKey: ["guia-kits-publicos"], queryFn: listarKitsAtivos });
  const nivel = busca.nivel!;
  const linha = busca.linha!;

  const { itens } = useMemo(
    () => montarConjunto({ nivel, linha, foco: busca.foco, peso: busca.peso, formato: busca.formato, kits: kits ?? [], overlays }),
    [nivel, linha, busca.foco, busca.peso, busca.formato, kits, overlays],
  );
  const explorar = useMemo(
    () => depoisExplore(nivel, linha, overlays, new Set(itens.map((i) => i.produto.slug))),
    [nivel, linha, overlays, itens],
  );

  return (
    <section id="resultado" className="mt-16 scroll-mt-24 rounded-lg border border-primary/30 bg-card p-6 sm:p-8">
      <p className="eyebrow text-primary">Resultado</p>
      <h2 className="mt-1 text-3xl font-bold uppercase">
        Seu perfil: {PERFIS[nivel].nome} · linha {ROTULO_LINHA_PUBLICA[linha]}
      </h2>
      <p className="mt-3 max-w-3xl text-muted-foreground">{PERFIS[nivel].texto}</p>

      <h3 className="mt-8 text-lg font-semibold uppercase">Seu conjunto</h3>
      <div className="mt-4">
        {isLoading ? <p className="text-sm text-muted-foreground">Montando seu conjunto…</p> : <ConjuntoGuia itens={itens} nivel={nivel} linha={linha} />}
      </div>

      {explorar.length > 0 && (
        <>
          <h3 className="mt-10 text-lg font-semibold uppercase">Depois, explore</h3>
          <div className="mt-4 grid gap-4 min-[430px]:grid-cols-2 lg:grid-cols-3">
            {explorar.map((p) => (
              <ProductCard key={p.slug} produto={p} />
            ))}
          </div>
        </>
      )}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Button
          variant="outline"
          onClick={() => {
            void navigate({ to: "/comece-aqui", search: {}, hash: "quiz" });
          }}
        >
          <RotateCcw /> Refazer
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            void navigator.clipboard.writeText(window.location.href.split("#")[0]!);
            setCopiado(true);
            toast.success("Link do resultado copiado.");
          }}
        >
          <Copy /> {copiado ? "Link copiado" : "Copiar link do resultado"}
        </Button>
        <Link to="/comece-aqui/$nivel" params={{ nivel }} className="self-center text-sm text-primary hover:underline">
          Conhecer o perfil {PERFIS[nivel].nome}
        </Link>
      </div>
    </section>
  );
}

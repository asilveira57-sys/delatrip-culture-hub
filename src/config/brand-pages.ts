/**
 * Conteúdo institucional das páginas de marca (/<slug-da-marca>).
 *
 * COMO EDITAR
 * -----------
 * Cada marca herda o template genérico em `templatePadrao()`. Para
 * personalizar uma marca, adicione uma entrada em `BRAND_PAGES` usando o slug
 * da marca (mesmo slug de `src/data/brands.json`) e sobrescreva só os campos
 * que quiser. Tudo é opcional.
 *
 * Exemplo:
 *   "abduzido": {
 *     eyebrow: "Marca parceira",
 *     headline: "Abduzido — design autoral brasileiro",
 *     resumo: "Peças com identidade forte...",
 *     sobre: ["Parágrafo 1...", "Parágrafo 2..."],
 *     destaques: [{ titulo: "Feito no Brasil", descricao: "..." }],
 *     pais: "Brasil",
 *     fundacao: "2016",
 *     site: "https://...",
 *     instagram: "https://instagram.com/...",
 *     capa: "https://.../banner.jpg",
 *     seoTitle: "Abduzido na DeLaTrip",
 *     seoDescription: "Catálogo completo Abduzido...",
 *   },
 */

export type BrandDestaque = { titulo: string; descricao: string };

export type BrandPageContent = {
  eyebrow: string;
  headline: string;
  resumo: string;
  sobre: string[];
  destaques: BrandDestaque[];
  pais?: string | null;
  fundacao?: string | null;
  site?: string | null;
  instagram?: string | null;
  capa?: string | null;
  seoTitle?: string;
  seoDescription?: string;
};

export type BrandPageOverride = Partial<BrandPageContent>;

/** Template genérico aplicado a toda marca que ainda não foi editada. */
function templatePadrao(nome: string, totalProdutos: number): BrandPageContent {
  return {
    eyebrow: "Marca no catálogo DeLaTrip",
    headline: nome,
    resumo: `${nome} faz parte da curadoria da DeLaTrip. Conheça a marca e veja abaixo os produtos disponíveis no catálogo.`,
    sobre: [
      `${nome} integra a seleção de marcas da DeLaTrip, escolhida por qualidade, acabamento e identidade dentro da cultura canábica brasileira.`,
      `Esta página institucional reúne a apresentação da marca e ${totalProdutos} ${
        totalProdutos === 1 ? "produto relacionado" : "produtos relacionados"
      } no nosso catálogo. Consulte preço e disponibilidade na loja oficial.`,
    ],
    destaques: [
      {
        titulo: "Curadoria DeLaTrip",
        descricao: "Marca selecionada e acompanhada pelo nosso time de compras.",
      },
      {
        titulo: "Produtos originais",
        descricao: "Itens adquiridos de distribuidores e representantes oficiais.",
      },
      {
        titulo: "Compra na loja oficial",
        descricao: "Cada produto leva ao site oficial ou ao Mercado Livre da DeLaTrip.",
      },
    ],
    pais: null,
    fundacao: null,
    site: null,
    instagram: null,
    capa: null,
  };
}

/**
 * Personalizações por marca. Comece adicionando as marcas principais aqui.
 */
export const BRAND_PAGES: Record<string, BrandPageOverride> = {
  // "delatrip": { eyebrow: "Marca própria", headline: "DeLaTrip", ... },
};

export function getBrandPageContent(
  slug: string,
  nome: string,
  totalProdutos: number,
): BrandPageContent {
  const base = templatePadrao(nome, totalProdutos);
  const custom = BRAND_PAGES[slug];
  return custom ? { ...base, ...custom } : base;
}

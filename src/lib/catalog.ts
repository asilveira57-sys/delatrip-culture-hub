import productsData from "@/data/products.json";
import categoriesData from "@/data/categories.json";
import brandsData from "@/data/brands.json";
import postsData from "@/data/posts.json";

import {
  CATEGORY_META,
  CATEGORY_META_FALLBACK,
  type CategoryMeta,
} from "@/config/category-meta";

import imgSedas from "@/assets/prod-sedas.jpg";
import imgDichavador from "@/assets/prod-dichavador.jpg";
import imgBong from "@/assets/prod-bong.jpg";
import imgBandeja from "@/assets/prod-bandeja.jpg";

/**
 * Schema gerado pelo conversor "Tray CSV → JSON".
 * Os arquivos em src/data/ podem ser substituídos pelos exports reais da loja
 * sem nenhuma alteração de código.
 */
export type Product = {
  id: string;
  slug: string;
  nome: string;
  descricaoHtml: string;
  imagens: string[];
  categoriaId: string | null;
  categoriaNome: string | null;
  categoriaSlug: string | null;
  marca: string | null;
  marcaSlug: string | null;
  referencia: string | null;
  ean: string | null;
  ncm: string | null;
  pesoGramas: number | null;
  preco: number | null;
  precoPromocional: number | null;
  estoque: number;
  disponivel: boolean;
  destaque: boolean;
  lancamento: boolean;
  seoTitulo: string;
  seoDescricao: string | null;
  urlLoja: string | null;
  urlMercadoLivre: string | null;
  mlMapeado: boolean;
  /** Opcional: pares chave/valor extras exibidos na ficha técnica. */
  specs?: Record<string, string>;
};

export type Category = {
  id: string;
  paiId: string | null;
  nome: string;
  nivel: number;
  slug: string;
  ativo: boolean;
  totalProdutos?: number;
};

export type Brand = {
  nome: string;
  slug: string;
  totalProdutos: number;
  categoriaId: string | null;
  marcaPropria: boolean;
  logo: string | null;
  descricao: string | null;
  /** Campo editorial opcional, ausente no export da loja. */
  pais?: string | null;
};

export type Post = {
  slug: string;
  titulo: string;
  resumo: string;
  data: string;
  categoria: string;
  imagem: string;
  conteudo: string;
};

export const products = (productsData as Product[]).filter((p) => p.disponivel);
export const categories = (categoriesData as Category[]).filter((c) => c.ativo);
export const brands = brandsData as Brand[];
export const posts = [...(postsData as Post[])].sort((a, b) =>
  b.data.localeCompare(a.data),
);

const byId = new Map(categories.map((c) => [c.id, c]));

/* ---------------- categorias / hierarquia ---------------- */

export const rootCategories = categories.filter((c) => !c.paiId);

export function childrenOf(id: string) {
  return categories.filter((c) => c.paiId === id);
}

export function ancestorsOf(categoria: Category): Category[] {
  const cadeia: Category[] = [];
  let atual: Category | undefined = categoria;
  let guard = 0;
  while (atual && guard++ < 6) {
    cadeia.unshift(atual);
    atual = atual.paiId ? byId.get(atual.paiId) : undefined;
  }
  return cadeia;
}

/** Caminho de URL da categoria, ex.: "sedas/king-size". */
export function categoryPath(categoria: Category) {
  return ancestorsOf(categoria)
    .map((c) => c.slug)
    .join("/");
}

export function rootOf(categoria: Category) {
  return ancestorsOf(categoria)[0] ?? categoria;
}

export function getCategoryById(id: string | null) {
  return id ? byId.get(id) : undefined;
}

/** Resolve "sedas/king-size" (ou "sedas") para a categoria correspondente. */
export function getCategoryByPath(path: string) {
  const partes = path.split("/").filter(Boolean);
  if (partes.length === 0) return undefined;
  let atual: Category | undefined = rootCategories.find(
    (c) => c.slug === partes[0],
  );
  for (const slug of partes.slice(1)) {
    if (!atual) return undefined;
    atual = childrenOf(atual.id).find((c) => c.slug === slug);
  }
  return atual;
}

function descendantIds(id: string, acc: Set<string> = new Set()): Set<string> {
  acc.add(id);
  for (const filho of childrenOf(id)) descendantIds(filho.id, acc);
  return acc;
}

export function categoryMeta(categoria: Category): CategoryMeta {
  return CATEGORY_META[rootOf(categoria).slug] ?? CATEGORY_META_FALLBACK;
}

export function categoryName(id: string | null) {
  return getCategoryById(id)?.nome ?? "";
}

/* ---------------- produtos ---------------- */

export function getProduct(slug: string) {
  return products.find((p) => p.slug === slug);
}

export function productsByCategory(categoria: Category) {
  const ids = descendantIds(categoria.id);
  return products.filter((p) => p.categoriaId && ids.has(p.categoriaId));
}

export function productsByBrand(marcaSlug: string) {
  return products.filter((p) => p.marcaSlug === marcaSlug);
}

export const destaques = products.filter((p) => p.destaque);

/** Ficha técnica montada a partir dos campos do export + specs opcionais. */
export function productSpecs(produto: Product): [string, string][] {
  const base: [string, string | null][] = [
    ...Object.entries(produto.specs ?? {}),
    ["Referência", produto.referencia],
    ["EAN", produto.ean],
    ["NCM", produto.ncm],
    ["Peso", produto.pesoGramas ? `${produto.pesoGramas} g` : null],
  ];
  return base.filter((par): par is [string, string] => Boolean(par[1]));
}

/* ---------------- imagens ---------------- */

const fallbackPorCategoria: Record<string, string> = {
  sedas: imgSedas,
  piteirasfiltros: imgBandeja,
  dichavadores: imgDichavador,
  "bong-pipes": imgBong,
  bandejas: imgBandeja,
  "gas-isqueiro-macarico": imgDichavador,
  tabaco: imgSedas,
  charutos: imgSedas,
  vestuario: imgBandeja,
  promocao: imgSedas,
  acessorios: imgBandeja,
};


export function imageFor(produto: Product) {
  if (produto.imagens.length > 0) return produto.imagens[0];
  const categoria = getCategoryById(produto.categoriaId);
  const raiz = categoria ? rootOf(categoria).slug : "";
  return fallbackPorCategoria[raiz] ?? imgSedas;
}

const imagensEditoriais: Record<string, string> = {
  sedas: imgSedas,
  dichavador: imgDichavador,
  bong: imgBong,
  bandeja: imgBandeja,
};

/** Imagem de posts do blog e blocos editoriais (chave simbólica no JSON). */
export function imageForKey(key: string) {
  return imagensEditoriais[key] ?? imgSedas;
}

/* ---------------- marcas ---------------- */

export function getBrand(slug: string) {
  return brands.find((b) => b.slug === slug);
}

export function brandName(slug: string | null) {
  if (!slug) return "";
  return getBrand(slug)?.nome ?? slug;
}

/* ---------------- posts ---------------- */

export function getPost(slug: string) {
  return posts.find((p) => p.slug === slug);
}

/* ---------------- busca e formatação ---------------- */

/** Casa o termo contra nome, marca, categoria e referência do produto. */
export function matchesQuery(produto: Product, q: string) {
  const termo = q.trim().toLowerCase();
  if (!termo) return true;
  return [
    produto.nome,
    produto.marca,
    produto.categoriaNome ?? categoryName(produto.categoriaId),
    produto.referencia,
  ]
    .filter(Boolean)
    .some((campo) => (campo as string).toLowerCase().includes(termo));
}

export function searchProducts(termo: string) {
  return products.filter((p) => matchesQuery(p, termo));
}

export function searchBrands(termo: string) {
  const q = termo.trim().toLowerCase();
  if (!q) return [] as Brand[];
  return brands.filter((b) => b.nome.toLowerCase().includes(q));
}

export function searchAll(termo: string) {
  const q = termo.trim();
  if (!q) return { produtos: [] as Product[], marcas: [] as Brand[] };
  return {
    produtos: searchProducts(q).slice(0, 8),
    marcas: searchBrands(q).slice(0, 5),
  };
}

export const SORT_OPTIONS = [
  { value: "relevancia", label: "Mais relevantes" },
  { value: "nome-az", label: "Nome (A–Z)" },
  { value: "nome-za", label: "Nome (Z–A)" },
  { value: "novidades", label: "Lançamentos primeiro" },
] as const;

export type SortKey = (typeof SORT_OPTIONS)[number]["value"];

export function sortProducts(lista: Product[], ordem: SortKey) {
  const copia = [...lista];
  switch (ordem) {
    case "nome-az":
      return copia.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
    case "nome-za":
      return copia.sort((a, b) => b.nome.localeCompare(a.nome, "pt-BR"));
    case "novidades":
      return copia.sort(
        (a, b) =>
          Number(b.lancamento) - Number(a.lancamento) ||
          Number(b.destaque) - Number(a.destaque),
      );
    default:
      return copia.sort(
        (a, b) =>
          Number(b.destaque) - Number(a.destaque) ||
          a.nome.localeCompare(b.nome, "pt-BR"),
      );
  }
}

/** Filtro unificado usado pelo catálogo e pela página de busca. */
export function filterProducts({
  q = "",
  categoria = "",
  marca = "",
  ordem = "relevancia",
}: {
  q?: string;
  categoria?: string;
  marca?: string;
  ordem?: SortKey;
}) {
  const cat = categoria ? getCategoryByPath(categoria) : undefined;
  const base = categoria ? (cat ? productsByCategory(cat) : []) : products;
  const filtrados = base.filter(
    (p) => (!marca || p.marcaSlug === marca) && matchesQuery(p, q),
  );
  return sortProducts(filtrados, ordem);
}

/** Marcas presentes em um conjunto de produtos (para filtros contextuais). */
export function brandsOf(lista: Product[]) {
  const slugs = new Set(lista.map((p) => p.marcaSlug).filter(Boolean));
  return brands.filter((b) => slugs.has(b.slug));
}

/** Texto puro a partir da descrição HTML — usado em meta tags e resumos. */
export function plainText(html: string, limite = 300) {
  const texto = html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
  return texto.length > limite ? `${texto.slice(0, limite - 1)}…` : texto;
}

export function formatDate(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function formatPrice(valor: number | null) {
  if (valor === null) return "";
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

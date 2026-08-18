import productsData from "@/data/products.index.json";
import categoriesData from "@/data/categories.json";
import { SITE } from "@/config/site";
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
  imagem: string | null;
  categoriaId: string | null;
  categoriaNome: string | null;
  categoriaSlug: string | null;
  marca: string | null;
  marcaSlug: string | null;
  referencia: string | null;
  preco: number | null;
  precoPromocional: number | null;
  estoque: number;
  disponivel: boolean;
  destaque: boolean;
  lancamento: boolean;
  urlLoja: string | null;
  urlMercadoLivre: string | null;
};

/** Campos pesados carregados sob demanda na página do produto. */
export type ProductDetail = {
  descricaoHtml: string;
  seoTitulo: string;
  seoDescricao: string | null;
  imagens: string[];
  ean: string | null;
  ncm: string | null;
  pesoGramas: number | null;
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

export type { Post } from "@/lib/editorial";
export { posts, imageForKey } from "@/lib/editorial";

/** Registro compacto gravado por scripts/split-products.mjs. */
type SlimProduct = {
  s: string;
  n: string;
  d?: string;
  m?: string;
  c?: string;
  r?: string;
  p?: number;
  pp?: number;
  e?: number;
  f?: number;
  i?: string;
  u?: string | null;
  ml?: string | null;
  mn?: string;
  cn?: string;
};

const IMG_PREFIX = "https://images.tcdn.com.br/img/img_prod/";
const LOJA_PREFIX = "https://www.delatrip.com.br/";
const ML_PREFIX = "https://lista.mercadolivre.com.br/loja/";

/**
 * Busca do Mercado Livre pelo título do produto dentro da loja oficial
 * DeLaTrip (URL de storefront).
 */
export function mercadoLivreSearchUrl(titulo: string) {
  const termo = titulo
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const busca = titulo.replace(/\s+/g, " ").trim();
  return `${ML_PREFIX}${SITE.mercadoLivreLoja}/${termo}_NoIndex_True?sb=storefront_url#D[A:${encodeURIComponent(busca)}]`;
}


/* ---------------- restrição legal (RDC ANVISA nº 558/2021) ----------------
 * Produtos derivados do tabaco não podem ser comercializados pela internet.
 * Este é o ponto único de restrição: `categories` e `products` derivam daqui,
 * então busca, filtros, páginas de marca e contagens seguem automaticamente.
 */

const rawCategories = (categoriesData as Category[]).filter((c) => c.ativo);
const rawById = new Map(rawCategories.map((c) => [c.id, c]));

/** Raízes cujo conteúdo é produto fumígeno derivado do tabaco. */
const RAIZES_RESTRITAS = new Set(["tabaco", "charutos"]);
/** Exceções: não são derivados do tabaco (blend sem nicotina / acessórios). */
const CATEGORIAS_LIBERADAS = new Set(["ervas-flores", "acessorios-tabaco"]);

const acessoriosId =
  rawCategories.find((c) => !c.paiId && c.slug === "acessorios")?.id ?? null;

function rawRootOf(categoria: Category): Category {
  let atual: Category = categoria;
  let guard = 0;
  while (atual.paiId && guard++ < 6) {
    const pai = rawById.get(atual.paiId);
    if (!pai) break;
    atual = pai;
  }
  return atual;
}

/** True quando a categoria representa produto derivado do tabaco. */
export function categoriaRestrita(categoria: Category): boolean {
  if (CATEGORIAS_LIBERADAS.has(categoria.slug)) return false;
  return RAIZES_RESTRITAS.has(rawRootOf(categoria).slug);
}

const idsRestritos = new Set(
  rawCategories.filter(categoriaRestrita).map((c) => c.id),
);

export const categories = rawCategories
  .filter((c) => !idsRestritos.has(c.id))
  // Reparenta as liberadas (hoje filhas de "tabaco") sob "acessorios".
  .map((c) =>
    CATEGORIAS_LIBERADAS.has(c.slug) && acessoriosId
      ? { ...c, paiId: acessoriosId, nivel: 2 }
      : c,
  );

export const brands = brandsData as Brand[];
export const posts = [...(postsData as Post[])].sort((a, b) =>
  b.data.localeCompare(a.data),
);

const byId = new Map(categories.map((c) => [c.id, c]));
const brandById = new Map(brands.map((b) => [b.slug, b]));

/** Texto pré-normalizado usado pela busca (evita lowercase por tecla). */
const haystack = new WeakMap<Product, string>();

function hydrate(r: SlimProduct): Product {
  const categoria = r.c ? byId.get(r.c) : undefined;
  const flags = r.f ?? 0;
  const produto: Product = {
    id: r.d ?? r.s,
    slug: r.s,
    nome: r.n,
    imagem: r.i ? (r.i.startsWith("http") ? r.i : IMG_PREFIX + r.i) : null,
    categoriaId: r.c ?? null,
    categoriaNome: categoria?.nome ?? r.cn ?? null,
    categoriaSlug: categoria?.slug ?? null,
    marca: (r.m ? brandById.get(r.m)?.nome : undefined) ?? r.mn ?? null,
    marcaSlug: r.m ?? null,
    referencia: r.r ?? null,
    preco: r.p ?? null,
    precoPromocional: r.pp ?? null,
    estoque: r.e ?? 0,
    disponivel: (flags & 4) === 0,
    destaque: (flags & 1) !== 0,
    lancamento: (flags & 2) !== 0,
    urlLoja: r.u !== undefined ? r.u : LOJA_PREFIX + r.s,
    // Sempre busca pelo título dentro da loja oficial DeLaTrip no ML.
    urlMercadoLivre: mercadoLivreSearchUrl(r.n),
  };
  haystack.set(
    produto,
    [produto.nome, produto.marca, produto.categoriaNome, produto.referencia]
      .filter(Boolean)
      .join(" ")
      .toLowerCase(),
  );
  return produto;
}

export const products = (productsData as SlimProduct[])
  .filter((r) => !(r.c && idsRestritos.has(r.c)))
  .map(hydrate)
  .filter((p) => p.disponivel);


/* ---------------- categorias / hierarquia ---------------- */

export const rootCategories = categories.filter((c) => !c.paiId);

const childrenById = new Map<string, Category[]>();
for (const c of categories) {
  if (!c.paiId) continue;
  const lista = childrenById.get(c.paiId);
  if (lista) lista.push(c);
  else childrenById.set(c.paiId, [c]);
}

export function childrenOf(id: string) {
  return childrenById.get(id) ?? [];
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

const descendantCache = new Map<string, Set<string>>();

function descendantIds(id: string): Set<string> {
  const cached = descendantCache.get(id);
  if (cached) return cached;
  const acc = new Set<string>();
  const fila = [id];
  while (fila.length) {
    const atual = fila.pop() as string;
    acc.add(atual);
    for (const filho of childrenOf(atual)) fila.push(filho.id);
  }
  descendantCache.set(id, acc);
  return acc;
}

export function categoryMeta(categoria: Category): CategoryMeta {
  return CATEGORY_META[rootOf(categoria).slug] ?? CATEGORY_META_FALLBACK;
}

export function categoryName(id: string | null) {
  return getCategoryById(id)?.nome ?? "";
}

/* ---------------- produtos ---------------- */

const productBySlug = new Map(products.map((p) => [p.slug, p]));

const productsByCategoryId = new Map<string, Product[]>();
const productsByBrandSlug = new Map<string, Product[]>();
for (const p of products) {
  if (p.categoriaId) {
    const lista = productsByCategoryId.get(p.categoriaId);
    if (lista) lista.push(p);
    else productsByCategoryId.set(p.categoriaId, [p]);
  }
  if (p.marcaSlug) {
    const lista = productsByBrandSlug.get(p.marcaSlug);
    if (lista) lista.push(p);
    else productsByBrandSlug.set(p.marcaSlug, [p]);
  }
}

export function getProduct(slug: string) {
  return productBySlug.get(slug);
}

const categoryProductsCache = new Map<string, Product[]>();

export function productsByCategory(categoria: Category) {
  const cached = categoryProductsCache.get(categoria.id);
  if (cached) return cached;
  const ids = descendantIds(categoria.id);
  const lista: Product[] = [];
  for (const id of ids) {
    const doNo = productsByCategoryId.get(id);
    if (doNo) lista.push(...doNo);
  }
  categoryProductsCache.set(categoria.id, lista);
  return lista;
}

export function productsByBrand(marcaSlug: string) {
  return productsByBrandSlug.get(marcaSlug) ?? [];
}


export const destaques = products.filter((p) => p.destaque);

/** Ficha técnica montada a partir dos campos do export + specs opcionais. */
export function productSpecs(
  produto: Product,
  detalhe?: ProductDetail | null,
): [string, string][] {
  const base: [string, string | null][] = [
    ...Object.entries(detalhe?.specs ?? {}),
    ["Referência", produto.referencia],
    ["EAN", detalhe?.ean ?? null],
    ["NCM", detalhe?.ncm ?? null],
    ["Peso", detalhe?.pesoGramas ? `${detalhe.pesoGramas} g` : null],
  ];
  return base.filter((par): par is [string, string] => Boolean(par[1]));
}

/* ---------------- detalhes sob demanda ---------------- */

const DETAIL_BUCKETS = 64;

const detailModules = import.meta.glob<Record<string, ProductDetail>>(
  "@/data/details/*.json",
  { import: "default" },
);

function bucketOf(slug: string) {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  return h % DETAIL_BUCKETS;
}

/** Carrega apenas a fatia de detalhes que contém o produto pedido. */
export async function getProductDetail(
  slug: string,
): Promise<ProductDetail | null> {
  const nome = String(bucketOf(slug)).padStart(2, "0");
  const chave = Object.keys(detailModules).find((k) =>
    k.endsWith(`/details/${nome}.json`),
  );
  if (!chave) return null;
  const carregar = detailModules[chave];
  if (!carregar) return null;
  const fatia = await carregar();
  return fatia[slug] ?? null;
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
  if (produto.imagem) return produto.imagem;
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
  return brandById.get(slug);
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
  return (haystack.get(produto) ?? "").includes(termo);
}

export function searchProducts(termo: string, limite = Infinity) {
  const q = termo.trim().toLowerCase();
  if (!q) return products;
  const achados: Product[] = [];
  for (const p of products) {
    if ((haystack.get(p) ?? "").includes(q)) {
      achados.push(p);
      if (achados.length >= limite) break;
    }
  }
  return achados;
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
    produtos: searchProducts(q, 8),
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

/** Comparador reutilizado: Intl.Collator é ~10x mais rápido que localeCompare. */
const collator = new Intl.Collator("pt-BR");

const comparadores: Record<SortKey, (a: Product, b: Product) => number> = {
  "nome-az": (a, b) => collator.compare(a.nome, b.nome),
  "nome-za": (a, b) => collator.compare(b.nome, a.nome),
  novidades: (a, b) =>
    Number(b.lancamento) - Number(a.lancamento) ||
    Number(b.destaque) - Number(a.destaque),
  relevancia: (a, b) =>
    Number(b.destaque) - Number(a.destaque) || collator.compare(a.nome, b.nome),
};

export function sortProducts(lista: Product[], ordem: SortKey) {
  return [...lista].sort(comparadores[ordem] ?? comparadores.relevancia);
}

/** Resultados memoizados por (categoria|marca|ordem) sem termo de busca. */
const listaCache = new Map<string, Product[]>();

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
  const termo = q.trim().toLowerCase();
  const chave = `${categoria}|${marca}|${ordem}`;
  if (!termo) {
    const cached = listaCache.get(chave);
    if (cached) return cached;
  }

  const cat = categoria ? getCategoryByPath(categoria) : undefined;
  let base: Product[];
  if (categoria) base = cat ? productsByCategory(cat) : [];
  else if (marca) base = productsByBrand(marca);
  else base = products;

  const filtrados: Product[] = [];
  for (const p of base) {
    if (marca && p.marcaSlug !== marca) continue;
    if (termo && !(haystack.get(p) ?? "").includes(termo)) continue;
    filtrados.push(p);
  }

  const ordenados = sortProducts(filtrados, ordem);
  if (!termo) listaCache.set(chave, ordenados);
  return ordenados;
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

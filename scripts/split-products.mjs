/**
 * Gera os artefatos consumidos pelo app a partir do export completo do
 * conversor Tray (src/data/products.json):
 *
 *  - src/data/products.index.json  → índice compacto para listagens/busca
 *  - src/data/details/NN.json      → descrição, SEO e ficha técnica, em 64
 *                                    fatias carregadas sob demanda
 *
 * O índice é gravado em formato compacto: chaves curtas, campos deriváveis
 * omitidos (nome da marca/categoria, URLs padrão da loja e do Mercado Livre,
 * prefixo do CDN de imagens). src/lib/catalog.ts reidrata para o tipo
 * `Product` completo no carregamento.
 *
 * Rode `node scripts/split-products.mjs` sempre que substituir products.json.
 */
import fs from "node:fs";
import path from "node:path";

export const DETAIL_BUCKETS = 64;

export function bucketOf(slug) {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  return h % DETAIL_BUCKETS;
}

/** Mantidos em sincronia com src/lib/catalog.ts. */
export const IMG_PREFIX = "https://images.tcdn.com.br/img/img_prod/";
export const LOJA_PREFIX = "https://www.delatrip.com.br/";
export const ML_PREFIX = "https://lista.mercadolivre.com.br/";

const SRC = "src/data/products.json";
const OUT_INDEX = "src/data/products.index.json";
const OUT_DIR = "src/data/details";

const produtos = JSON.parse(fs.readFileSync(SRC, "utf8"));

const index = produtos.map((p) => {
  const slim = { s: p.slug, n: p.nome };

  if (p.id) slim.d = String(p.id);
  if (p.marcaSlug) slim.m = p.marcaSlug;
  if (p.categoriaId) slim.c = String(p.categoriaId);
  if (p.referencia) slim.r = p.referencia;
  if (p.preco != null) slim.p = p.preco;
  if (p.precoPromocional != null) slim.pp = p.precoPromocional;
  if (p.estoque) slim.e = p.estoque;

  // flags: 1 = destaque, 2 = lançamento, 4 = indisponível
  const f =
    (p.destaque ? 1 : 0) | (p.lancamento ? 2 : 0) | (p.disponivel ? 0 : 4);
  if (f) slim.f = f;

  const imagem = p.imagens?.[0] ?? null;
  if (imagem) {
    slim.i = imagem.startsWith(IMG_PREFIX)
      ? imagem.slice(IMG_PREFIX.length)
      : imagem;
  }

  // URLs só entram no índice quando fogem do padrão derivável do slug.
  if (p.urlLoja && p.urlLoja !== LOJA_PREFIX + p.slug) slim.u = p.urlLoja;
  else if (!p.urlLoja) slim.u = null;
  if (p.urlMercadoLivre && p.urlMercadoLivre !== ML_PREFIX + p.slug)
    slim.ml = p.urlMercadoLivre;
  else if (!p.urlMercadoLivre) slim.ml = null;

  // Nome de marca/categoria divergentes do cadastro viram override explícito.
  if (p.marca && !p.marcaSlug) slim.mn = p.marca;
  if (p.categoriaNome && !p.categoriaId) slim.cn = p.categoriaNome;

  return slim;
});

const buckets = Array.from({ length: DETAIL_BUCKETS }, () => ({}));
for (const p of produtos) {
  buckets[bucketOf(p.slug)][p.slug] = {
    descricaoHtml: p.descricaoHtml ?? "",
    seoTitulo: p.seoTitulo ?? p.nome,
    seoDescricao: p.seoDescricao ?? null,
    imagens: p.imagens ?? [],
    ean: p.ean ?? null,
    ncm: p.ncm ?? null,
    pesoGramas: p.pesoGramas ?? null,
    specs: p.specs ?? undefined,
  };
}

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT_INDEX, JSON.stringify(index));
buckets.forEach((b, i) => {
  const nome = String(i).padStart(2, "0");
  fs.writeFileSync(path.join(OUT_DIR, `${nome}.json`), JSON.stringify(b));
});

console.log(
  `index: ${index.length} produtos (${(fs.statSync(OUT_INDEX).size / 1e6).toFixed(2)} MB) · ${DETAIL_BUCKETS} fatias de detalhe`,
);

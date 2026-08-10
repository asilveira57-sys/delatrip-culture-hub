/**
 * Gera os artefatos consumidos pelo app a partir do export completo do
 * conversor Tray (src/data/products.json):
 *
 *  - src/data/products.index.json  → campos usados em listagens/busca (leve)
 *  - src/data/details/NN.json      → descrição, SEO e ficha técnica, em 64
 *                                    fatias carregadas sob demanda
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

const SRC = "src/data/products.json";
const OUT_INDEX = "src/data/products.index.json";
const OUT_DIR = "src/data/details";

const INDEX_FIELDS = [
  "id",
  "slug",
  "nome",
  "marca",
  "marcaSlug",
  "categoriaId",
  "categoriaNome",
  "categoriaSlug",
  "preco",
  "precoPromocional",
  "estoque",
  "disponivel",
  "destaque",
  "lancamento",
  "referencia",
  "urlLoja",
  "urlMercadoLivre",
];

const produtos = JSON.parse(fs.readFileSync(SRC, "utf8"));

const index = produtos.map((p) => {
  const slim = {};
  for (const f of INDEX_FIELDS) slim[f] = p[f] ?? null;
  slim.imagem = p.imagens?.[0] ?? null;
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

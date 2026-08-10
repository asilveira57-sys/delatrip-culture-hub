# Dados do catálogo (schema do conversor Tray CSV → JSON)

Os três arquivos abaixo são gerados pela ferramenta **DeLaTrip — Conversor Tray CSV → JSON**
e podem ser substituídos diretamente pelos exports reais da loja, sem tocar em código.

## products.json

```jsonc
{
  "id": "2001",
  "slug": "seda-raw-classic-1-1-4",
  "nome": "Seda RAW Classic 1 1/4",
  "descricaoHtml": "<p>…</p>",
  "imagens": ["https://…/foto.jpg"],   // vazio → placeholder por categoria
  "categoriaId": "101",
  "categoriaNome": "1 1/4",
  "categoriaSlug": "1-1-4",
  "marca": "RAW",                       // nome exibido
  "marcaSlug": "raw",                   // usado nos links /marcas/:slug
  "referencia": null, "ean": null, "ncm": null, "pesoGramas": null,
  "preco": 9.9, "precoPromocional": null,
  "estoque": 10, "disponivel": true,
  "destaque": true, "lancamento": false,
  "seoTitulo": "…", "seoDescricao": "…",
  "urlLoja": "https://www.delatrip.com.br/…",
  "urlMercadoLivre": null,              // null → botão do ML não é renderizado
  "mlMapeado": false,
  "specs": { "Tamanho": "1 1/4" }        // opcional, não vem do conversor
}
```

- Produtos com `disponivel: false` são filtrados automaticamente.
- Nunca gere o JSON com a opção **preço de custo** ligada: o arquivo é público.

### Importante: rode o split depois de substituir o arquivo

`products.json` é a **fonte** (não é importada pelo app, para não pesar o bundle).
Depois de substituí-lo, rode:

```bash
node scripts/split-products.mjs   # gera products.index.json + details/*.json
node scripts/gen-sitemap.mjs      # regenera public/sitemap.xml
```

- `products.index.json` — campos leves usados em listagens, filtros e busca
  (inclui apenas `imagem`, a primeira foto).
- `details/NN.json` — descrição, SEO, galeria e ficha técnica, em 64 fatias
  carregadas sob demanda pela página do produto.


## categories.json

Lista **plana** com hierarquia por `paiId`:
`{ id, paiId, nome, nivel, slug, ativo, totalProdutos }`

A URL da categoria é montada pela cadeia de slugs (`/catalogo/sedas/king-size`).
Ícone e texto de apoio de cada categoria raiz ficam em `src/config/category-meta.ts`
(casados pelo `slug`) — categorias novas caem em um fallback genérico.

## brands.json

`{ nome, slug, totalProdutos, categoriaId, marcaPropria, logo, descricao, pais? }`

`descricao` e `pais` são campos editoriais opcionais (o conversor gera `descricao: null`).

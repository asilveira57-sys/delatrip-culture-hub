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

## categories.json

Lista **plana** com hierarquia por `paiId`:
`{ id, paiId, nome, nivel, slug, ativo, totalProdutos }`

A URL da categoria é montada pela cadeia de slugs (`/catalogo/sedas/king-size`).
Ícone e texto de apoio de cada categoria raiz ficam em `src/config/category-meta.ts`
(casados pelo `slug`) — categorias novas caem em um fallback genérico.

## brands.json

`{ nome, slug, totalProdutos, categoriaId, marcaPropria, logo, descricao, pais? }`

`descricao` e `pais` são campos editoriais opcionais (o conversor gera `descricao: null`).

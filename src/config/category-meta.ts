/**
 * Metadados editoriais das categorias (ícone e texto de apoio).
 * O JSON exportado da loja traz apenas id/nome/slug/hierarquia, então a
 * curadoria visual fica aqui, casada pelo slug da categoria raiz.
 */
export type CategoryMeta = { icone: string; descricao: string };

export const CATEGORY_META: Record<string, CategoryMeta> = {
  sedas: {
    icone: "ScrollText",
    descricao: "Papéis de enrolar de todos os tamanhos e gramaturas.",
  },
  "piteiras-e-filtros": {
    icone: "Filter",
    descricao: "Piteiras de papel, vidro e filtros de carvão ativado.",
  },
  dichavadores: {
    icone: "CircleDot",
    descricao: "Alumínio, acrílico e madeira, de 2 a 4 partes.",
  },
  "bongs-e-pipes": {
    icone: "FlaskConical",
    descricao: "Vidro borossilicato, silicone e peças artesanais.",
  },
  bandejas: {
    icone: "Square",
    descricao: "Bandejas de metal e madeira em vários tamanhos.",
  },
  "gas-isqueiro-macarico": {
    icone: "Flame",
    descricao: "Isqueiros, maçaricos e refis de gás butano.",
  },
  tabacos: {
    icone: "Leaf",
    descricao: "Tabacos para cachimbo, narguilé e enrolar.",
  },
  acessorios: {
    icone: "Package",
    descricao: "Cinzeiros, potes herméticos, cases e limpeza.",
  },
};

export const CATEGORY_META_FALLBACK: CategoryMeta = {
  icone: "Package",
  descricao: "Produtos selecionados desta categoria no catálogo DeLaTrip.",
};

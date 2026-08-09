/**
 * Metadados editoriais das categorias (ícone e texto de apoio).
 * O JSON exportado da loja traz apenas id/nome/slug/hierarquia, então a
 * curadoria visual fica aqui, casada pelo slug da categoria raiz.
 */
export type CategoryMeta = { icone: string; descricao: string };

export const CATEGORY_META: Record<string, CategoryMeta> = {
  promocao: {
    icone: "Tag",
    descricao: "Seleção de produtos com preço promocional na loja oficial.",
  },
  sedas: {
    icone: "ScrollText",
    descricao: "Papéis de enrolar de todos os tamanhos e gramaturas.",
  },
  piteirasfiltros: {
    icone: "Filter",
    descricao: "Piteiras de papel, vidro e filtros de carvão ativado.",
  },
  dichavadores: {
    icone: "CircleDot",
    descricao: "Alumínio, policarbonato, fibra e metal, de 2 a 4 partes.",
  },
  "bong-pipes": {
    icone: "FlaskConical",
    descricao: "Vidro borossilicato, silicone e peças artesanais.",
  },
  bandejas: {
    icone: "Square",
    descricao: "Bandejas de metal, madeira, bamboo e cristal.",
  },
  "gas-isqueiro-macarico": {
    icone: "Flame",
    descricao: "Isqueiros, maçaricos, fluidos e refis de gás butano.",
  },
  tabaco: {
    icone: "Leaf",
    descricao: "Tabacos naturais, palha, ervas e acessórios.",
  },
  charutos: {
    icone: "Cigarette",
    descricao: "Charutos e acessórios para apreciadores.",
  },
  vestuario: {
    icone: "Shirt",
    descricao: "Camisetas, bonés, bags e streetwear da cultura DeLaTrip.",
  },
  acessorios: {
    icone: "Package",
    descricao: "Cinzeiros, potes herméticos, cases, tesouras e limpeza.",
  },
};


export const CATEGORY_META_FALLBACK: CategoryMeta = {
  icone: "Package",
  descricao: "Produtos selecionados desta categoria no catálogo DeLaTrip.",
};

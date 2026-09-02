export type TipoCampo = "texto" | "textarea" | "rich" | "lista" | "imagem";

export type CampoItem = { chave: string; label: string };

export type CampoEditavel = {
  chave: string;
  label: string;
  tipo: TipoCampo;
  ajuda?: string;
  /** Para tipo "lista": campos de cada item e quantidade fixa. */
  itens?: CampoItem[];
  quantidade?: number;
};

export type PaginaEditavel = {
  /** Identificador usado na URL do admin. */
  id: string;
  caminho: string;
  nome: string;
  /** Observação exibida no admin. */
  ajuda?: string;
  campos: CampoEditavel[];
};

export const PAGINAS_EDITAVEIS: PaginaEditavel[] = [
  {
    id: "home",
    caminho: "/",
    nome: "Home",
    campos: [
      { chave: "hero_titulo", label: "Título do hero", tipo: "texto" },
      { chave: "hero_subtitulo", label: "Subtítulo do hero", tipo: "textarea" },
      { chave: "hero_cta_primario", label: "Botão principal", tipo: "texto" },
      { chave: "hero_cta_secundario", label: "Botão secundário", tipo: "texto" },
      { chave: "secao_categorias_titulo", label: "Título da seção de categorias", tipo: "texto" },
      { chave: "secao_marcas_titulo", label: "Título da seção de marcas", tipo: "texto" },
      { chave: "secao_blog_titulo", label: "Título da seção do blog", tipo: "texto" },
      {
        chave: "faixa_confianca",
        label: "Faixa de confiança",
        tipo: "lista",
        quantidade: 4,
        itens: [
          { chave: "icone", label: "Ícone" },
          { chave: "titulo", label: "Título" },
        ],
        ajuda: "Ícones disponíveis: shield, truck, sparkles, headset, leaf, award.",
      },
    ],
  },
  {
    id: "quem-somos",
    caminho: "/quem-somos",
    nome: "Quem somos",
    campos: [
      { chave: "titulo", label: "Título", tipo: "texto" },
      { chave: "subtitulo", label: "Subtítulo", tipo: "textarea" },
      { chave: "corpo", label: "Corpo", tipo: "rich" },
    ],
  },
  {
    id: "marcas",
    caminho: "/marcas",
    nome: "Marcas (listagem)",
    campos: [
      { chave: "titulo", label: "Título", tipo: "texto" },
      { chave: "subtitulo", label: "Subtítulo", tipo: "textarea" },
      { chave: "intro", label: "Introdução", tipo: "rich" },
    ],
  },
  {
    id: "blog",
    caminho: "/blog",
    nome: "Blog (listagem)",
    campos: [
      { chave: "titulo", label: "Título", tipo: "texto" },
      { chave: "subtitulo", label: "Subtítulo", tipo: "textarea" },
      { chave: "intro", label: "Introdução", tipo: "rich" },
    ],
  },
  {
    id: "catalogo",
    caminho: "/catalogo",
    nome: "Catálogo (listagem)",
    campos: [
      { chave: "titulo", label: "Título", tipo: "texto" },
      { chave: "subtitulo", label: "Subtítulo", tipo: "textarea" },
    ],
  },
  {
    id: "faq",
    caminho: "/faq",
    nome: "Perguntas frequentes",
    campos: [
      { chave: "titulo", label: "Título", tipo: "texto" },
      { chave: "subtitulo", label: "Subtítulo", tipo: "textarea" },
    ],
    ajuda: "As perguntas em si são editadas no menu FAQ.",
  },
  {
    id: "lgpd",
    caminho: "/lgpd",
    nome: "LGPD e seus direitos",
    campos: [
      { chave: "titulo", label: "Título", tipo: "texto" },
      { chave: "subtitulo", label: "Subtítulo", tipo: "textarea" },
    ],
    ajuda: "O texto legal completo é editado no menu Legal.",
  },
  {
    id: "acessorios",
    caminho: "/acessorios",
    nome: "Acessórios",
    campos: [
      { chave: "titulo", label: "Título", tipo: "texto" },
      { chave: "intro", label: "Introdução", tipo: "rich" },
    ],
  },
  {
    id: "contato",
    caminho: "/contato",
    nome: "Contato",
    campos: [
      { chave: "titulo", label: "Título", tipo: "texto" },
      { chave: "intro", label: "Introdução", tipo: "rich" },
      { chave: "whatsapp", label: "WhatsApp", tipo: "texto" },
      { chave: "email", label: "E-mail", tipo: "texto" },
      { chave: "horario_atendimento", label: "Horário de atendimento", tipo: "texto" },
      { chave: "endereco", label: "Endereço", tipo: "texto" },
    ],
  },
  {
    id: "conteudo-tabaco",
    caminho: "/conteudo/tabaco",
    nome: "Conteúdo — Tabaco",
    campos: [
      { chave: "titulo", label: "Título", tipo: "texto" },
      { chave: "corpo", label: "Corpo", tipo: "rich" },
    ],
  },
];

export function paginaPorId(id: string) {
  return PAGINAS_EDITAVEIS.find((p) => p.id === id);
}

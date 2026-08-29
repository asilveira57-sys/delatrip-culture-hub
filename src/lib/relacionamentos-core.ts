/**
 * Motor de relevância do blog: pontua produtos e outras postagens em relação
 * a um post. Puro (sem I/O) — roda no admin, grava o resultado no banco e a
 * página pública apenas lê o que já foi calculado.
 */

export type ModoProdutos = "automatico" | "categoria" | "manual" | "hibrido";
export type ModoConteudos = "automatico" | "manual" | "hibrido";
export type Ordenacao =
  | "relevancia"
  | "manual"
  | "lancamentos"
  | "preco"
  | "personalizada";

export const MODOS_PRODUTOS: { valor: ModoProdutos; label: string }[] = [
  { valor: "automatico", label: "Automático" },
  { valor: "categoria", label: "Por categoria" },
  { valor: "manual", label: "Manual" },
  { valor: "hibrido", label: "Híbrido" },
];

export const MODOS_CONTEUDOS: { valor: ModoConteudos; label: string }[] = [
  { valor: "automatico", label: "Automático" },
  { valor: "manual", label: "Manual" },
  { valor: "hibrido", label: "Híbrido" },
];

export const ORDENACOES: { valor: Ordenacao; label: string }[] = [
  { valor: "relevancia", label: "Relevância" },
  { valor: "manual", label: "Seleção manual primeiro" },
  { valor: "lancamentos", label: "Lançamentos" },
  { valor: "preco", label: "Preço" },
  { valor: "personalizada", label: "Ordem personalizada" },
];

export const QUANTIDADES_PRODUTOS = [4, 6, 8, 10, 12];
export const QUANTIDADES_CONTEUDOS = [3, 4, 6, 8, 10];

/** Pesos ajustáveis — ficam em config_site para evoluir sem deploy. */
export type Pesos = {
  titulo: number;
  categoria: number;
  tags: number;
  conteudo: number;
  cluster: number;
};

export const PESOS_PADRAO: Pesos = {
  titulo: 30,
  categoria: 25,
  tags: 20,
  conteudo: 15,
  cluster: 25,
};

export type ConfigGlobalRelacionamentos = {
  quantidadeProdutos: number;
  quantidadeConteudos: number;
  exibirSemEstoque: boolean;
  minimoScoreProduto: number;
  minimoScoreConteudo: number;
  maxLinksInternos: number;
  pesos: Pesos;
};

export const CONFIG_GLOBAL_PADRAO: ConfigGlobalRelacionamentos = {
  quantidadeProdutos: 8,
  quantidadeConteudos: 6,
  exibirSemEstoque: false,
  minimoScoreProduto: 18,
  minimoScoreConteudo: 12,
  maxLinksInternos: 8,
  pesos: PESOS_PADRAO,
};

export type ConfigPost = {
  slug_post: string;
  modo_produtos: ModoProdutos;
  modo_conteudos: ModoConteudos;
  quantidade_produtos: number | null;
  quantidade_conteudos: number | null;
  ordenacao_produtos: Ordenacao;
  ordenacao_conteudos: Ordenacao;
  categorias: string[];
  exibir_sem_estoque: boolean | null;
  recalculado_em?: string | null;
};

export function configPostPadrao(slug: string): ConfigPost {
  return {
    slug_post: slug,
    modo_produtos: "hibrido",
    modo_conteudos: "hibrido",
    quantidade_produtos: null,
    quantidade_conteudos: null,
    ordenacao_produtos: "relevancia",
    ordenacao_conteudos: "relevancia",
    categorias: [],
    exibir_sem_estoque: null,
  };
}

export type Relacao = {
  slug: string;
  origem: string;
  score: number;
  manual: boolean;
  excluido: boolean;
  fixado: boolean;
  posicao: number;
};

/* ---------------- texto ---------------- */

const STOPWORDS = new Set(
  ("a as o os um uma uns umas de do da dos das em no na nos nas por para com sem sob sobre " +
    "que qual quais como quando onde porque pois mais menos muito pouco todo toda todos todas " +
    "seu sua seus suas este esta esse essa aquele aquela isso isto ele ela eles elas nao sim " +
    "ser sao esta estao tem tem ter foi era pelo pela entre ate apos ja tambem mesmo cada " +
    "voce nosso nossa the and for you with").split(" "),
);

export function normalizarTexto(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenizar(texto: string): string[] {
  return normalizarTexto(texto)
    .split(" ")
    .filter((t) => t.length >= 4 && !STOPWORDS.has(t));
}

function conjunto(texto: string) {
  return new Set(tokenizar(texto));
}

function intersecao(a: Set<string>, b: Set<string>) {
  let n = 0;
  for (const t of a) if (b.has(t)) n++;
  return n;
}

/** Documento do post usado como base da comparação. */
export type DocumentoPost = {
  slug: string;
  titulo: string;
  resumo?: string | null;
  conteudoHtml?: string | null;
  categoria?: string | null;
  seoTitulo?: string | null;
  seoDescricao?: string | null;
  keywords?: string | null;
  tags?: string[];
  clusters?: string[];
  clusterPrincipal?: string | null;
  data?: string | null;
};

export type DocumentoProduto = {
  slug: string;
  nome: string;
  marca?: string | null;
  categoriaSlug?: string | null;
  categoriaNome?: string | null;
  descricao?: string | null;
  estoque?: number;
  lancamento?: boolean;
  preco?: number | null;
};

export type Indice = {
  titulo: Set<string>;
  chaves: Set<string>;
  conteudo: Set<string>;
  categoria: string;
  tags: Set<string>;
  clusters: Set<string>;
};

export function indexarPost(doc: DocumentoPost): Indice {
  return {
    titulo: conjunto([doc.titulo, doc.seoTitulo ?? "", doc.slug.replace(/-/g, " ")].join(" ")),
    chaves: conjunto([doc.keywords ?? "", doc.seoDescricao ?? "", doc.resumo ?? ""].join(" ")),
    conteudo: conjunto(
      [doc.titulo, doc.resumo ?? "", doc.conteudoHtml ?? "", doc.keywords ?? ""].join(" "),
    ),
    categoria: normalizarTexto(doc.categoria ?? ""),
    tags: new Set((doc.tags ?? []).map((t) => normalizarTexto(t)).filter(Boolean)),
    clusters: new Set((doc.clusters ?? []).map((c) => normalizarTexto(c)).filter(Boolean)),
  };
}

export type Pontuacao = { score: number; origens: string[] };

function percentual(bruto: number, maximo: number) {
  return Math.max(0, Math.min(100, Math.round((bruto / maximo) * 100)));
}

/** Relevância entre o post e um produto do catálogo (0–100). */
export function pontuarProduto(
  indice: Indice,
  produto: DocumentoProduto,
  pesos: Pesos = PESOS_PADRAO,
): Pontuacao {
  const nome = conjunto([produto.nome, produto.marca ?? ""].join(" "));
  const categoria = normalizarTexto(produto.categoriaNome ?? produto.categoriaSlug ?? "");
  const descricao = conjunto(produto.descricao ?? "");

  let bruto = 0;
  const origens: string[] = [];

  const noTitulo = intersecao(nome, indice.titulo);
  if (noTitulo > 0) {
    bruto += pesos.titulo * Math.min(1, noTitulo / 2);
    origens.push("título");
  }

  const catTokens = new Set(tokenizar(categoria));
  const catMatch =
    (indice.categoria && categoria && indice.categoria.includes(categoria)) ||
    intersecao(catTokens, indice.titulo) > 0 ||
    intersecao(catTokens, indice.chaves) > 0;
  if (catMatch) {
    bruto += pesos.categoria;
    origens.push("categoria");
  }

  const porTags = intersecao(nome, indice.tags) + intersecao(catTokens, indice.tags);
  if (porTags > 0) {
    bruto += pesos.tags * Math.min(1, porTags / 2);
    origens.push("tags");
  }

  const noConteudo = intersecao(nome, indice.conteudo) + intersecao(descricao, indice.chaves);
  if (noConteudo > 0) {
    bruto += pesos.conteudo * Math.min(1, noConteudo / 3);
    origens.push("conteúdo");
  }

  const porCluster = intersecao(nome, indice.clusters) + intersecao(catTokens, indice.clusters);
  if (porCluster > 0) {
    bruto += pesos.cluster;
    origens.push("cluster");
  }

  const total = pesos.titulo + pesos.categoria + pesos.tags + pesos.conteudo + pesos.cluster;
  return { score: percentual(bruto, total), origens };
}

/** Similaridade temática entre duas postagens (0–100). */
export function pontuarPost(
  indice: Indice,
  alvo: DocumentoPost,
  pesos: Pesos = PESOS_PADRAO,
): Pontuacao {
  const outro = indexarPost(alvo);
  let bruto = 0;
  const origens: string[] = [];

  const tit = intersecao(indice.titulo, outro.titulo);
  if (tit > 0) {
    bruto += pesos.titulo * Math.min(1, tit / 3);
    origens.push("título");
  }
  if (indice.categoria && indice.categoria === outro.categoria) {
    bruto += pesos.categoria;
    origens.push("categoria");
  }
  const tags = intersecao(indice.tags, outro.tags);
  if (tags > 0) {
    bruto += pesos.tags * Math.min(1, tags / 2);
    origens.push("tags");
  }
  const conteudo = intersecao(indice.conteudo, outro.conteudo);
  if (conteudo > 0) {
    bruto += pesos.conteudo * Math.min(1, conteudo / 12);
    origens.push("conteúdo");
  }
  const cluster = intersecao(indice.clusters, outro.clusters);
  if (cluster > 0) {
    bruto += pesos.cluster;
    origens.push("cluster");
  }

  const total = pesos.titulo + pesos.categoria + pesos.tags + pesos.conteudo + pesos.cluster;
  return { score: percentual(bruto, total), origens };
}

export function rotuloRelevancia(score: number) {
  if (score >= 80) return "muito relacionado";
  if (score >= 55) return "relacionado";
  if (score >= 30) return "relação moderada";
  return "relação fraca";
}

/* ---------------- links internos ---------------- */

export type SugestaoLink = {
  ancora: string;
  slug_destino: string;
  titulo_destino: string;
  score: number;
};

/**
 * Procura, no texto do post, trechos que correspondam ao tema de outras
 * postagens. Nunca aplica sozinho: o admin aprova ou ignora.
 */
export function sugerirLinksInternos(
  atual: DocumentoPost,
  candidatos: DocumentoPost[],
  opcoes: { maximo?: number } = {},
): SugestaoLink[] {
  const textoPlano = (atual.conteudoHtml ?? "")
    .replace(/<a\b[^>]*>[\s\S]*?<\/a>/gi, " ")
    .replace(/<[^>]+>/g, " ");
  const normalizado = normalizarTexto(textoPlano);
  if (!normalizado) return [];

  const palavras = textoPlano.split(/\s+/).filter(Boolean).length;
  const maximo = opcoes.maximo ?? Math.max(3, Math.min(8, Math.round(palavras / 180)));

  const usados = new Set<string>();
  const sugestoes: SugestaoLink[] = [];

  for (const candidato of candidatos) {
    if (candidato.slug === atual.slug) continue;
    const termos = tokenizar(candidato.titulo);
    // Frases de 2 a 3 termos consecutivos do título do destino.
    const frases: string[] = [];
    for (let n = 3; n >= 2; n--) {
      for (let i = 0; i + n <= termos.length; i++) {
        frases.push(termos.slice(i, i + n).join(" "));
      }
    }
    const encontrada = frases.find((f) => f.length >= 8 && normalizado.includes(f));
    if (!encontrada || usados.has(encontrada)) continue;
    usados.add(encontrada);
    sugestoes.push({
      ancora: encontrada,
      slug_destino: candidato.slug,
      titulo_destino: candidato.titulo,
      score: Math.min(100, 40 + encontrada.split(" ").length * 15),
    });
  }

  return sugestoes.sort((a, b) => b.score - a.score).slice(0, maximo);
}

/* ---------------- seleção final ---------------- */

/**
 * Regra fundamental: manual sempre vence. Fixados vêm primeiro, excluídos
 * nunca aparecem e a automação só preenche as vagas restantes.
 */
export function selecionarExibidos(relacoes: Relacao[], limite: number, minimo = 0) {
  const validas = relacoes.filter((r) => !r.excluido);
  const fixados = validas
    .filter((r) => r.fixado)
    .sort((a, b) => a.posicao - b.posicao || b.score - a.score);
  const manuais = validas
    .filter((r) => r.manual && !r.fixado)
    .sort((a, b) => a.posicao - b.posicao || b.score - a.score);
  const automaticos = validas
    .filter((r) => !r.manual && !r.fixado && r.score >= minimo)
    .sort((a, b) => b.score - a.score);
  const ordenadas = [...fixados, ...manuais, ...automaticos];
  const vistos = new Set<string>();
  const saida: Relacao[] = [];
  for (const r of ordenadas) {
    if (vistos.has(r.slug)) continue;
    vistos.add(r.slug);
    saida.push(r);
    if (saida.length >= limite) break;
  }
  return saida;
}

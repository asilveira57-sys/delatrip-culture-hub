import type { CampoEditavel } from "@/config/paginas-editaveis";
import type { BrandPageContent } from "@/config/brand-pages";
import { lista, rich, texto, type Blocos } from "@/lib/paginas-core";

/** Caminho usado nas tabelas `pagina` e `seo_rota` para a página da marca. */
export function caminhoMarca(slug: string) {
  return `/${slug}`;
}

/** Campos editáveis da página institucional de marca (mesmo formato de /admin/paginas). */
export const CAMPOS_MARCA: CampoEditavel[] = [
  { chave: "eyebrow", label: "Chapéu (eyebrow)", tipo: "texto" },
  { chave: "headline", label: "Título principal", tipo: "texto" },
  { chave: "resumo", label: "Resumo (abaixo do título)", tipo: "textarea" },
  {
    chave: "sobre_html",
    label: "Sobre a marca",
    tipo: "rich",
    ajuda: "Texto livre — aceita formatação visual ou HTML colado.",
  },
  {
    chave: "destaques",
    label: "Destaques",
    tipo: "lista",
    quantidade: 3,
    itens: [
      { chave: "titulo", label: "Título" },
      { chave: "descricao", label: "Descrição" },
    ],
  },
  { chave: "pais", label: "País de origem", tipo: "texto" },
  { chave: "fundacao", label: "Ano de fundação", tipo: "texto" },
  {
    chave: "capa",
    label: "Imagem de capa",
    tipo: "imagem",
    ajuda: "Envie um arquivo (JPG, PNG ou WebP) de até 8MB.",
  },
];

export type ConteudoMarca = BrandPageContent & { sobreHtml: string | null };

/** Mescla o conteúdo do banco sobre o template padrão da marca. */
export function conteudoMarca(base: BrandPageContent, blocos: Blocos | null): ConteudoMarca {
  const opcional = (chave: string, padrao: string | null | undefined) => {
    const valor = blocos?.[chave];
    return typeof valor === "string" && valor.trim() ? valor.trim() : (padrao ?? null);
  };

  return {
    ...base,
    eyebrow: texto(blocos, "eyebrow", base.eyebrow),
    headline: texto(blocos, "headline", base.headline),
    resumo: texto(blocos, "resumo", base.resumo),
    sobreHtml: rich(blocos, "sobre_html"),
    destaques: lista(blocos, "destaques", base.destaques)
      .map((d) => ({
        titulo: String((d as { titulo?: unknown }).titulo ?? ""),
        descricao: String((d as { descricao?: unknown }).descricao ?? ""),
      }))
      .filter((d) => d.titulo.trim() || d.descricao.trim()),
    pais: opcional("pais", base.pais),
    fundacao: opcional("fundacao", base.fundacao),
    site: opcional("site", base.site),
    instagram: opcional("instagram", base.instagram),
    capa: opcional("capa", base.capa),
  };
}

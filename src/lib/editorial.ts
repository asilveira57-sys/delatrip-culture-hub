import postsData from "@/data/posts.json";

import imgSedas from "@/assets/prod-sedas.jpg";
import imgDichavador from "@/assets/prod-dichavador.jpg";
import imgBong from "@/assets/prod-bong.jpg";
import imgBandeja from "@/assets/prod-bandeja.jpg";

/**
 * Módulo leve de conteúdo editorial: posts legados e imagens simbólicas.
 * Fica separado de `catalog.ts` para que blog, admin e páginas institucionais
 * não precisem carregar o índice de produtos (centenas de KB).
 */
export type Post = {
  slug: string;
  titulo: string;
  resumo: string;
  conteudo: string;
  data: string;
  categoria: string;
  imagem: string;
};

export const posts = [...(postsData as Post[])].sort((a, b) =>
  b.data.localeCompare(a.data),
);

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

import productsData from "@/data/products.json";
import categoriesData from "@/data/categories.json";
import brandsData from "@/data/brands.json";
import postsData from "@/data/posts.json";

import imgSedas from "@/assets/prod-sedas.jpg";
import imgDichavador from "@/assets/prod-dichavador.jpg";
import imgBong from "@/assets/prod-bong.jpg";
import imgBandeja from "@/assets/prod-bandeja.jpg";

export type Product = {
  slug: string;
  nome: string;
  marca: string;
  categoria: string;
  subcategoria?: string;
  imagem: string;
  destaque: boolean;
  preco: number;
  descricao: string;
  specs: Record<string, string>;
  linkOficial: string;
  linkMercadoLivre: string;
};

export type Subcategory = { slug: string; nome: string };

export type Category = {
  slug: string;
  nome: string;
  descricao: string;
  icone: string;
  subcategorias: Subcategory[];
};

export type Brand = {
  slug: string;
  nome: string;
  pais: string;
  descricao: string;
};

export type Post = {
  slug: string;
  titulo: string;
  resumo: string;
  data: string;
  categoria: string;
  imagem: string;
  conteudo: string;
};

export const products = productsData as Product[];
export const categories = categoriesData as Category[];
export const brands = brandsData as Brand[];
export const posts = [...(postsData as Post[])].sort((a, b) =>
  b.data.localeCompare(a.data),
);

const imageMap: Record<string, string> = {
  sedas: imgSedas,
  dichavador: imgDichavador,
  bong: imgBong,
  bandeja: imgBandeja,
};

export function imageFor(key: string) {
  return imageMap[key] ?? imgSedas;
}

export function getCategory(slug: string) {
  return categories.find((c) => c.slug === slug);
}

export function getBrand(slug: string) {
  return brands.find((b) => b.slug === slug);
}

export function getProduct(slug: string) {
  return products.find((p) => p.slug === slug);
}

export function getPost(slug: string) {
  return posts.find((p) => p.slug === slug);
}

export function brandName(slug: string) {
  return getBrand(slug)?.nome ?? slug;
}

export function categoryName(slug: string) {
  return getCategory(slug)?.nome ?? slug;
}

export function productsByCategory(categoria: string, subcategoria?: string) {
  return products.filter(
    (p) =>
      p.categoria === categoria &&
      (!subcategoria || p.subcategoria === subcategoria),
  );
}

export function productsByBrand(marca: string) {
  return products.filter((p) => p.marca === marca);
}

export const destaques = products.filter((p) => p.destaque);

export function searchAll(termo: string) {
  const q = termo.trim().toLowerCase();
  if (!q) return { produtos: [] as Product[], marcas: [] as Brand[] };
  return {
    produtos: products
      .filter(
        (p) =>
          p.nome.toLowerCase().includes(q) ||
          brandName(p.marca).toLowerCase().includes(q),
      )
      .slice(0, 8),
    marcas: brands.filter((b) => b.nome.toLowerCase().includes(q)).slice(0, 5),
  };
}

export function formatDate(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function formatPrice(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

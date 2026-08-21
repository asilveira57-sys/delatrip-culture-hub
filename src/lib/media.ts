import { supabase } from "@/integrations/supabase/client";

export const LIMITE_BYTES = 8 * 1024 * 1024;
/** Tipos aceitos no upload de imagens (capa, editor). */
export const TIPOS_ACEITOS = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
export const ACCEPT_IMAGENS = TIPOS_ACEITOS.join(",");
const NOMES_TIPOS = "JPG, PNG, WebP, GIF ou AVIF";
const LARGURA_MAX = 1600;
/** ~100 anos: a URL assinada funciona como link estável para o site público. */
const VALIDADE_SEGUNDOS = 60 * 60 * 24 * 365 * 100;

export function formatarTamanho(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function suportaWebp() {
  try {
    const c = document.createElement("canvas");
    return c.toDataURL("image/webp").startsWith("data:image/webp");
  } catch {
    return false;
  }
}

function sufixo() {
  return Math.random().toString(36).slice(2, 8);
}

async function redimensionar(file: File): Promise<{ blob: Blob; ext: string }> {
  const bitmap = await createImageBitmap(file);
  const escala = Math.min(1, LARGURA_MAX / bitmap.width);
  const largura = Math.round(bitmap.width * escala);
  const altura = Math.round(bitmap.height * escala);

  const canvas = document.createElement("canvas");
  canvas.width = largura;
  canvas.height = altura;
  const ctx = canvas.getContext("2d");
  if (!ctx) return { blob: file, ext: file.name.split(".").pop() ?? "jpg" };
  ctx.drawImage(bitmap, 0, 0, largura, altura);
  bitmap.close?.();

  const webp = suportaWebp();
  const tipo = webp ? "image/webp" : "image/jpeg";
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, tipo, 0.85),
  );
  if (!blob) return { blob: file, ext: file.name.split(".").pop() ?? "jpg" };
  return { blob, ext: webp ? "webp" : "jpg" };
}

export type ImagemEnviada = { url: string; tamanho: number; caminho: string };

/**
 * Valida um arquivo de imagem antes do envio.
 * Devolve a mensagem de erro em pt-BR ou `null` quando o arquivo é válido.
 */
export function validarImagem(file: File): string | null {
  if (file.size === 0) return "Arquivo vazio ou corrompido. Escolha outra imagem.";
  const tipo = (file.type || "").toLowerCase();
  if (!tipo.startsWith("image/")) {
    return `Este arquivo não é uma imagem. Envie ${NOMES_TIPOS}.`;
  }
  if (!TIPOS_ACEITOS.includes(tipo)) {
    return `Formato não suportado (${tipo.replace("image/", "").toUpperCase()}). Envie ${NOMES_TIPOS}.`;
  }
  if (file.size > LIMITE_BYTES) {
    return `Arquivo muito grande: ${formatarTamanho(file.size)}. O limite é 8MB.`;
  }
  return null;
}

/** Redimensiona no cliente, envia ao bucket "blog" e devolve URL assinada longa. */
export async function enviarImagem(file: File, base: string): Promise<ImagemEnviada> {
  const erro = validarImagem(file);
  if (erro) throw new Error(erro);
  const { blob, ext } = await redimensionar(file);
  const slugBase = (base || "imagem")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
  const caminho = `${slugBase}-${sufixo()}.${ext}`;

  const { error } = await supabase.storage
    .from("blog")
    .upload(caminho, blob, { contentType: blob.type, upsert: false });
  if (error) throw error;

  const { data, error: erroUrl } = await supabase.storage
    .from("blog")
    .createSignedUrl(caminho, VALIDADE_SEGUNDOS);
  if (erroUrl || !data) throw erroUrl ?? new Error("Falha ao gerar URL da imagem.");

  return { url: data.signedUrl, tamanho: blob.size, caminho };
}

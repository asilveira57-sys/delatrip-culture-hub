import { z } from "zod";

/** Versão vigente das políticas — muda quando o texto legal é atualizado. */
export const VERSAO_POLITICA = "1.0";

export const CATEGORIAS_CONTATO = [
  { valor: "geral", label: "Contato geral" },
  { valor: "imprensa", label: "Imprensa" },
  { valor: "parcerias", label: "Parcerias" },
  { valor: "podcast", label: "Podcast" },
  { valor: "comercial", label: "Comercial" },
  { valor: "lgpd", label: "Privacidade e LGPD" },
  { valor: "outros", label: "Outros" },
] as const;

export const TIPOS_LGPD = [
  { valor: "acesso", label: "Acesso aos dados" },
  { valor: "correcao", label: "Correção" },
  { valor: "eliminacao", label: "Eliminação" },
  { valor: "revogacao", label: "Revogação de consentimento" },
  { valor: "informacoes", label: "Informações sobre tratamento" },
  { valor: "outros", label: "Outros" },
] as const;

export const STATUS_SOLICITACAO = [
  "recebida",
  "em_analise",
  "respondida",
  "concluida",
] as const;

export const ROTULO_STATUS: Record<string, string> = {
  recebida: "Recebida",
  em_analise: "Em análise",
  respondida: "Respondida",
  concluida: "Concluída",
};

export const contatoSchema = z.object({
  nome: z.string().trim().min(2, "Informe seu nome.").max(120, "Máximo de 120 caracteres."),
  email: z.string().trim().email("E-mail inválido.").max(200),
  telefone: z.string().trim().max(40).optional().or(z.literal("")),
  categoria: z.string().trim().min(1).max(40),
  assunto: z.string().trim().min(2, "Informe o assunto.").max(160),
  mensagem: z
    .string()
    .trim()
    .min(10, "Escreva pelo menos 10 caracteres.")
    .max(4000, "Máximo de 4000 caracteres."),
  consentimento: z.literal(true, {
    errorMap: () => ({ message: "É necessário concordar com a Política de Privacidade." }),
  }),
  desafio: z.string().trim().min(1, "Responda a verificação."),
  armadilha: z.string().max(0).optional().or(z.literal("")),
  origem: z.string().max(200).optional(),
  utm: z.record(z.string()).optional(),
});

export type ContatoEntrada = z.infer<typeof contatoSchema>;

export const lgpdSchema = z.object({
  nome: z.string().trim().min(2, "Informe seu nome.").max(120),
  email: z.string().trim().email("E-mail inválido.").max(200),
  tipo: z.string().trim().min(1).max(40),
  descricao: z
    .string()
    .trim()
    .min(10, "Descreva sua solicitação com pelo menos 10 caracteres.")
    .max(4000),
  desafio: z.string().trim().min(1, "Responda a verificação."),
  armadilha: z.string().max(0).optional().or(z.literal("")),
});

export type LgpdEntrada = z.infer<typeof lgpdSchema>;

/** Categorias de cookies gerenciadas pelo banner de consentimento. */
export type CategoriasConsentimento = {
  necessarios: true;
  preferencias: boolean;
  analise: boolean;
  marketing: boolean;
};

export const CONSENTIMENTO_VAZIO: CategoriasConsentimento = {
  necessarios: true,
  preferencias: false,
  analise: false,
  marketing: false,
};

export type Consentimento = {
  versao: string;
  data: string;
  categorias: CategoriasConsentimento;
};

export type EpisodioPodcast = {
  slug: string;
  titulo: string;
  descricao: string | null;
  resumo: string | null;
  conteudo_html: string | null;
  capa_url: string | null;
  capa_alt: string | null;
  data_publicacao: string | null;
  participantes: string | null;
  spotify_url: string | null;
  youtube_url: string | null;
  outro_url: string | null;
  transcricao: string | null;
  duracao: string | null;
  publicado: boolean;
  seo_titulo: string | null;
  seo_descricao: string | null;
  seo_keywords: string | null;
  og_imagem: string | null;
};

export type DocumentoLegal = {
  chave: string;
  titulo: string;
  conteudo_html: string;
  versao: string;
  status: string;
  publicado_em: string | null;
  updated_at: string | null;
};

/** Dados institucionais editáveis no admin, com fallback no código. */
export type EmpresaConfig = {
  razaoSocial: string;
  cnpj: string;
  telefone: string;
  whatsapp: string;
  email: string;
  horario: string;
  endereco: string;
};

export type RedesConfig = {
  instagram: string;
  youtube: string;
  spotify: string;
  facebook: string;
  tiktok: string;
  outra: string;
};

export type SeoPadraoConfig = {
  titulo: string;
  descricao: string;
  ogImagem: string;
};

export type LgpdConfig = {
  emailResponsavel: string;
  versaoPolitica: string;
  atualizadoEm: string;
};

export type PortalConfig = {
  empresa: EmpresaConfig;
  redes: RedesConfig;
  seoPadrao: SeoPadraoConfig;
  lgpd: LgpdConfig;
};

export function mesclarConfig(
  padrao: PortalConfig,
  valores: Record<string, unknown>,
): PortalConfig {
  const parte = <T extends object>(chave: string, base: T): T => {
    const v = valores[chave];
    return v && typeof v === "object" ? { ...base, ...(v as T) } : base;
  };
  return {
    empresa: parte("empresa", padrao.empresa),
    redes: parte("redes", padrao.redes),
    seoPadrao: parte("seo_padrao", padrao.seoPadrao),
    lgpd: parte("lgpd_config", padrao.lgpd),
  };
}

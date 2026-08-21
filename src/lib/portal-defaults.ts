import { SITE } from "@/config/site";
import type { PortalConfig } from "@/lib/portal-core";
import { VERSAO_POLITICA } from "@/lib/portal-core";

/** Valores usados enquanto o admin não preencher Configurações do portal. */
export const PORTAL_CONFIG_PADRAO: PortalConfig = {
  empresa: {
    razaoSocial: SITE.razaoSocial,
    cnpj: SITE.cnpj,
    telefone: SITE.telefone,
    whatsapp: SITE.telefoneLink,
    email: SITE.email,
    horario: SITE.horarioAtendimento,
    endereco: SITE.endereco,
  },
  redes: {
    instagram: SITE.redes.instagram,
    youtube: SITE.redes.youtube,
    spotify: "",
    facebook: SITE.redes.facebook,
    tiktok: "",
    outra: "",
  },
  seoPadrao: {
    titulo: "DelaTrip — Cultura, Lifestyle e Universo Headshop",
    descricao: SITE.descricao,
    ogImagem: "",
  },
  lgpd: {
    emailResponsavel: SITE.email,
    versaoPolitica: VERSAO_POLITICA,
    atualizadoEm: "",
  },
};

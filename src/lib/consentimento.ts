import {
  CONSENTIMENTO_VAZIO,
  VERSAO_POLITICA,
  type CategoriasConsentimento,
  type Consentimento,
} from "@/lib/portal-core";

const KEY = "delatrip_consent_v2";
export const EVENTO_PREFERENCIAS = "delatrip:preferencias-cookies";

export function lerConsentimento(): Consentimento | null {
  if (typeof window === "undefined") return null;
  try {
    const bruto = window.localStorage.getItem(KEY);
    if (!bruto) return null;
    const dado = JSON.parse(bruto) as Consentimento;
    if (!dado?.categorias || dado.versao !== VERSAO_POLITICA) return null;
    return { ...dado, categorias: { ...CONSENTIMENTO_VAZIO, ...dado.categorias } };
  } catch {
    return null;
  }
}

export function salvarConsentimento(categorias: CategoriasConsentimento): Consentimento {
  const registro: Consentimento = {
    versao: VERSAO_POLITICA,
    data: new Date().toISOString(),
    categorias: { ...categorias, necessarios: true },
  };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(registro));
  } catch {
    /* navegação anônima pode bloquear o storage */
  }
  return registro;
}

/** Abre o painel de preferências a partir de qualquer lugar do site. */
export function abrirPreferenciasCookies() {
  window.dispatchEvent(new CustomEvent(EVENTO_PREFERENCIAS));
}

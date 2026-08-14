const KEY = "delatrip_anon_id";

/** UUID anônimo do visitante, criado na primeira interação e guardado no navegador. */
export function getAnonId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const atual = window.localStorage.getItem(KEY);
    if (atual && atual.length >= 8) return atual;
    const novo = crypto.randomUUID();
    window.localStorage.setItem(KEY, novo);
    return novo;
  } catch {
    return null;
  }
}

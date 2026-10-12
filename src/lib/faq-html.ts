/**
 * Descrições importadas da loja oficial trazem a FAQ como
 * <details><summary>Pergunta <img ícone/></summary><div>Resposta</div></details>.
 * Sem o CSS da loja, o ícone dentro do <summary> aparece gigante. Aqui a FAQ
 * é retirada do HTML e devolvida como itens para o componente de FAQ do site.
 */

const ENTIDADES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", ndash: "–", mdash: "—", hellip: "…",
};

export function decodificarEntidades(s: string) {
  return s.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === "#") {
      const n = e[1]?.toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(n) ? String.fromCodePoint(n) : m;
    }
    const nome = e.toLowerCase();
    if (ENTIDADES[nome]) return ENTIDADES[nome]!;
    // Letras acentuadas: &aacute; &ccedil; &atilde; ...
    const acento = /^([a-z])(acute|grave|circ|tilde|uml|cedil)$/i.exec(e);
    if (acento) {
      const marca = { acute: "\u0301", grave: "\u0300", circ: "\u0302", tilde: "\u0303", uml: "\u0308", cedil: "\u0327" }[
        acento[2]!.toLowerCase() as "acute"
      ];
      return (acento[1]! + marca).normalize("NFC");
    }
    return m;
  });
}

const RE_DETAILS = /<details[^>]*>\s*<summary[^>]*>([\s\S]*?)<\/summary>([\s\S]*?)<\/details>/gi;

export function extrairFaqDoHtml(html: string): {
  html: string;
  itens: { pergunta: string; resposta: string }[];
} {
  if (!html || !/<details/i.test(html)) return { html, itens: [] };
  const itens: { pergunta: string; resposta: string }[] = [];
  let limpo = html.replace(RE_DETAILS, (_m, sum: string, corpo: string) => {
    const pergunta = decodificarEntidades(sum.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
    const resposta = corpo.replace(/<img[^>]*>/gi, "").trim();
    if (pergunta && resposta.replace(/<[^>]+>/g, "").trim()) itens.push({ pergunta, resposta });
    return "";
  });
  if (itens.length === 0) return { html, itens };
  // Título "FAQ ..." que ficou órfão e contêineres vazios.
  limpo = limpo.replace(/<h[1-6][^>]*>(?:(?!<\/h[1-6]>)[\s\S])*?(faq|d&uacute;vidas frequentes|dúvidas frequentes|perguntas frequentes)[\s\S]*?<\/h[1-6]>/gi, "");
  for (let i = 0; i < 4; i++) limpo = limpo.replace(/<(div|h[1-6]|p)[^>]*>(\s|&nbsp;|<br\s*\/?>)*<\/\1>/gi, "");
  return { html: limpo.trim(), itens };
}

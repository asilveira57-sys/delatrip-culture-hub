import DOMPurify from "dompurify";

/** Tags permitidas no HTML editorial (blog, páginas e FAQ). */
export const TAGS_PERMITIDAS = [
  "p",
  "h2",
  "h3",
  "h4",
  "strong",
  "em",
  "u",
  "s",
  "sub",
  "sup",
  "code",
  "pre",
  "ul",
  "ol",
  "li",
  "blockquote",
  "a",
  "img",
  "figure",
  "figcaption",
  "hr",
  "br",
  "iframe",
  "table",
  "thead",
  "tbody",
  "tfoot",
  "tr",
  "th",
  "td",
  "span",
];

const ATRIBUTOS_PERMITIDOS = [
  "href",
  "src",
  "alt",
  "title",
  "target",
  "rel",
  "width",
  "height",
  "allow",
  "allowfullscreen",
  "loading",
  "frameborder",
  "data-align",
  "style",
  "colspan",
  "rowspan",
  "start",
];

/** Mantém apenas alinhamento de texto no atributo style. */
export function estiloSeguro(valor: string) {
  const m = /text-align\s*:\s*(left|right|center|justify)/i.exec(valor);
  return m ? `text-align: ${m[1]!.toLowerCase()}` : "";
}


const DOMINIOS_IFRAME = [
  "youtube.com",
  "www.youtube.com",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
  "instagram.com",
  "www.instagram.com",
  "open.spotify.com",
];

/** True quando o src do iframe aponta para um provedor liberado. */
export function iframePermitido(src: string) {
  try {
    const url = new URL(src, "https://exemplo.invalido");
    if (url.protocol !== "https:") return false;
    return DOMINIOS_IFRAME.includes(url.hostname);
  } catch {
    return false;
  }
}

function hrefSeguro(valor: string) {
  const v = valor.trim().toLowerCase();
  return !v.startsWith("javascript:") && !v.startsWith("data:") && !v.startsWith("vbscript:");
}

/** Sanitização sem DOM (SSR/worker): allowlist por expressão regular. */
function sanitizarSemDom(html: string) {
  let saida = html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, "");

  saida = saida.replace(/<(\/?)([a-zA-Z0-9]+)([^>]*)>/g, (_m, barra, tag, resto) => {
    const nome = String(tag).toLowerCase();
    if (!TAGS_PERMITIDAS.includes(nome)) return "";
    if (barra) return `</${nome}>`;

    const atributos: string[] = [];
    const re = /([a-zA-Z-]+)\s*=\s*("([^"]*)"|'([^']*)')/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(String(resto)))) {
      const chave = m[1]!.toLowerCase();
      const valor = m[3] ?? m[4] ?? "";
      if (chave.startsWith("on")) continue;
      if (!ATRIBUTOS_PERMITIDOS.includes(chave)) continue;
      if ((chave === "href" || chave === "src") && !hrefSeguro(valor)) continue;
      if (nome === "iframe" && chave === "src" && !iframePermitido(valor)) return "";
      atributos.push(`${chave}="${valor.replace(/"/g, "&quot;")}"`);
    }
    if (nome === "iframe" && !atributos.some((a) => a.startsWith("src="))) return "";
    return `<${nome}${atributos.length ? " " + atributos.join(" ") : ""}>`;
  });

  return saida;
}

/**
 * Limpa HTML vindo do editor ou do banco.
 * Roda no navegador com DOMPurify e no servidor com allowlist própria.
 */
export function sanitizarHtml(html: string | null | undefined): string {
  if (!html) return "";
  if (typeof window === "undefined" || !DOMPurify.isSupported) {
    return sanitizarSemDom(html);
  }
  const limpo = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: TAGS_PERMITIDAS,
    ALLOWED_ATTR: ATRIBUTOS_PERMITIDOS,
    ALLOW_DATA_ATTR: false,
    FORBID_ATTR: ["style", "class", "id"],
  });
  // DOMPurify não conhece nossa allowlist de provedores de embed.
  const doc = new DOMParser().parseFromString(`<div>${limpo}</div>`, "text/html");
  doc.querySelectorAll("iframe").forEach((frame) => {
    if (!iframePermitido(frame.getAttribute("src") ?? "")) frame.remove();
  });
  doc.querySelectorAll("a[href]").forEach((a) => {
    const href = a.getAttribute("href") ?? "";
    if (!hrefSeguro(href)) a.removeAttribute("href");
    if (a.getAttribute("target") === "_blank") a.setAttribute("rel", "noopener noreferrer");
  });
  return doc.body.firstElementChild?.innerHTML ?? "";
}

/** Texto puro a partir de HTML — usado em resumos e JSON-LD. */
export function htmlParaTexto(html: string | null | undefined) {
  return sanitizarHtml(html)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

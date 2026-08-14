import { Node, mergeAttributes } from "@tiptap/core";

import { iframePermitido } from "@/lib/sanitize";

/** figure > img + figcaption, com alinhamento em data-align. */
export const Figura = Node.create({
  name: "figura",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: "" },
      alt: { default: "" },
      legenda: {
        default: "",
        parseHTML: (el) => el.querySelector("figcaption")?.textContent ?? "",
        renderHTML: () => ({}),
      },
      align: {
        default: "center",
        parseHTML: (el) => el.getAttribute("data-align") ?? "center",
        renderHTML: (attrs) => ({ "data-align": attrs["align"] as string }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "figure",
        getAttrs: (el) => {
          const img = (el as HTMLElement).querySelector("img");
          if (!img) return false;
          return { src: img.getAttribute("src") ?? "", alt: img.getAttribute("alt") ?? "" };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    const legenda = String(node.attrs["legenda"] ?? "");
    const conteudo: unknown[] = [
      [
        "img",
        {
          src: node.attrs["src"],
          alt: node.attrs["alt"],
          loading: "lazy",
        },
      ],
    ];
    if (legenda) conteudo.push(["figcaption", {}, legenda]);
    return [
      "figure",
      mergeAttributes({ "data-align": node.attrs["align"] }, HTMLAttributes),
      ...conteudo,
    ] as never;
  },
});

/** iframe restrito a YouTube, Instagram e Spotify. */
export const Embed = Node.create({
  name: "embed",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return { src: { default: "" } };
  },

  parseHTML() {
    return [
      {
        tag: "iframe",
        getAttrs: (el) => {
          const src = (el as HTMLElement).getAttribute("src") ?? "";
          return iframePermitido(src) ? { src } : false;
        },
      },
    ];
  },

  renderHTML({ node }) {
    return [
      "iframe",
      {
        src: node.attrs["src"],
        loading: "lazy",
        allowfullscreen: "true",
        allow: "accelerometer; clipboard-write; encrypted-media; picture-in-picture",
      },
    ];
  },
});

/** Converte um link colado do YouTube, Instagram ou Spotify em src de iframe. */
export function urlParaEmbed(valor: string): string | null {
  let url: URL;
  try {
    url = new URL(valor.trim());
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^www\./, "");

  if (host === "youtu.be") {
    return `https://www.youtube-nocookie.com/embed/${url.pathname.slice(1)}`;
  }
  if (host === "youtube.com" || host === "youtube-nocookie.com") {
    const id = url.searchParams.get("v") ?? url.pathname.split("/").pop();
    if (!id) return null;
    return `https://www.youtube-nocookie.com/embed/${id}`;
  }
  if (host === "instagram.com") {
    const limpo = url.pathname.replace(/\/$/, "");
    return `https://www.instagram.com${limpo}/embed`;
  }
  if (host === "open.spotify.com") {
    return `https://open.spotify.com/embed${url.pathname}`;
  }
  return null;
}

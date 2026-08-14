import { useCallback, useEffect, useRef, useState } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Code,
  Heading2,
  Heading3,
  Heading4,
  Image as ImageIcon,
  Italic,
  Link2,
  Link2Off,
  List,
  ListOrdered,
  Minus,
  Pilcrow,
  Quote,
  Redo2,
  Square,
  Strikethrough,
  Undo2,
  Youtube,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { enviarImagem, formatarTamanho } from "@/lib/media";
import { sanitizarHtml } from "@/lib/sanitize";
import { cn } from "@/lib/utils";

import { Embed, Figura, urlParaEmbed } from "./nodes";

type Props = {
  valor: string;
  onChange: (html: string) => void;
  baseArquivo?: string;
  placeholder?: string;
  minAltura?: string;
};

function BotaoBarra({
  ativo,
  titulo,
  onClick,
  children,
}: {
  ativo?: boolean;
  titulo: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={titulo}
      aria-label={titulo}
      aria-pressed={!!ativo}
      onClick={onClick}
      className={cn(
        "rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground",
        ativo && "bg-muted text-foreground",
      )}
    >
      {children}
    </button>
  );
}

export function RichTextEditor({
  valor,
  onChange,
  baseArquivo = "conteudo",
  placeholder,
  minAltura = "22rem",
}: Props) {
  const [dialogoLink, setDialogoLink] = useState(false);
  const [dialogoImagem, setDialogoImagem] = useState(false);
  const [dialogoEmbed, setDialogoEmbed] = useState(false);

  const [linkUrl, setLinkUrl] = useState("");
  const [linkTexto, setLinkTexto] = useState("");
  const [linkNovaAba, setLinkNovaAba] = useState(true);

  const [imgArquivo, setImgArquivo] = useState<File | null>(null);
  const [imgAlt, setImgAlt] = useState("");
  const [imgLegenda, setImgLegenda] = useState("");
  const [imgAlign, setImgAlign] = useState<"left" | "center" | "full">("center");
  const [enviando, setEnviando] = useState(false);

  const [embedUrl, setEmbedUrl] = useState("");

  const ultimoHtml = useRef(valor);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        link: {
          openOnClick: false,
          autolink: true,
          HTMLAttributes: { rel: "noopener noreferrer" },
        },
      }),
      Figura,
      Embed,
    ],
    content: valor || "",
    editorProps: {
      attributes: {
        class: "prose-editor focus:outline-none",
        "aria-label": placeholder ?? "Editor de conteúdo",
      },
      transformPastedHTML: (html) => sanitizarHtml(html),
    },
    onUpdate: ({ editor: e }) => {
      const html = sanitizarHtml(e.getHTML());
      ultimoHtml.current = html;
      onChange(html);
    },
    immediatelyRender: false,
  });

  // Sincroniza quando o valor muda por fora (troca de post, carregamento).
  useEffect(() => {
    if (!editor) return;
    if (valor !== ultimoHtml.current) {
      ultimoHtml.current = valor;
      editor.commands.setContent(valor || "", { emitUpdate: false });
    }
  }, [valor, editor]);

  const abrirLink = useCallback(() => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    setLinkTexto(editor.state.doc.textBetween(from, to, " "));
    setLinkUrl((editor.getAttributes("link")["href"] as string) ?? "");
    setDialogoLink(true);
  }, [editor]);

  useEffect(() => {
    function atalho(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k" && editor?.isFocused) {
        e.preventDefault();
        abrirLink();
      }
    }
    window.addEventListener("keydown", atalho);
    return () => window.removeEventListener("keydown", atalho);
  }, [editor, abrirLink]);

  if (!editor) {
    return (
      <div
        className="rounded-md border border-border bg-background"
        style={{ minHeight: minAltura }}
      />
    );
  }

  function aplicarLink(e: Editor) {
    const url = linkUrl.trim();
    if (!url) return;
    const externo = /^https?:\/\//i.test(url) && !url.includes("delatrip");
    const attrs: Record<string, string> = { href: url };
    if (linkNovaAba) {
      attrs["target"] = "_blank";
      attrs["rel"] = "noopener noreferrer";
    } else if (externo) {
      attrs["rel"] = "noopener noreferrer";
    }

    const { from, to } = e.state.selection;
    const texto = linkTexto.trim();
    if (from === to && texto) {
      e.chain().focus().insertContent({ type: "text", text: texto, marks: [{ type: "link", attrs }] }).run();
    } else if (texto && texto !== e.state.doc.textBetween(from, to, " ")) {
      e.chain().focus().insertContent({ type: "text", text: texto, marks: [{ type: "link", attrs }] }).run();
    } else {
      e.chain().focus().extendMarkRange("link").setLink(attrs as never).run();
    }
    setDialogoLink(false);
    setLinkUrl("");
    setLinkTexto("");
  }

  async function inserirImagem() {
    if (!imgArquivo) {
      toast.error("Escolha um arquivo.");
      return;
    }
    if (!imgAlt.trim()) {
      toast.error("O texto alternativo é obrigatório.");
      return;
    }
    setEnviando(true);
    try {
      const { url, tamanho } = await enviarImagem(imgArquivo, baseArquivo);
      editor!
        .chain()
        .focus()
        .insertContent({
          type: "figura",
          attrs: { src: url, alt: imgAlt.trim(), legenda: imgLegenda.trim(), align: imgAlign },
        })
        .run();
      toast.success(`Imagem enviada (${formatarTamanho(tamanho)}).`);
      setDialogoImagem(false);
      setImgArquivo(null);
      setImgAlt("");
      setImgLegenda("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha no envio da imagem.");
    } finally {
      setEnviando(false);
    }
  }

  function inserirEmbed() {
    const src = urlParaEmbed(embedUrl);
    if (!src) {
      toast.error("Use um link do YouTube, Instagram ou Spotify.");
      return;
    }
    editor!.chain().focus().insertContent({ type: "embed", attrs: { src } }).run();
    setDialogoEmbed(false);
    setEmbedUrl("");
  }

  return (
    <div className="rounded-md border border-border bg-background">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border p-1">
        <BotaoBarra
          titulo="Parágrafo"
          ativo={editor.isActive("paragraph")}
          onClick={() => editor.chain().focus().setParagraph().run()}
        >
          <Pilcrow className="size-4" />
        </BotaoBarra>
        {([2, 3, 4] as const).map((nivel) => {
          const Icone = nivel === 2 ? Heading2 : nivel === 3 ? Heading3 : Heading4;
          return (
            <BotaoBarra
              key={nivel}
              titulo={`Título ${nivel}`}
              ativo={editor.isActive("heading", { level: nivel })}
              onClick={() => editor.chain().focus().toggleHeading({ level: nivel }).run()}
            >
              <Icone className="size-4" />
            </BotaoBarra>
          );
        })}
        <span className="mx-1 h-5 w-px bg-border" />
        <BotaoBarra
          titulo="Negrito"
          ativo={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="size-4" />
        </BotaoBarra>
        <BotaoBarra
          titulo="Itálico"
          ativo={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="size-4" />
        </BotaoBarra>
        <BotaoBarra
          titulo="Tachado"
          ativo={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough className="size-4" />
        </BotaoBarra>
        <BotaoBarra
          titulo="Código inline"
          ativo={editor.isActive("code")}
          onClick={() => editor.chain().focus().toggleCode().run()}
        >
          <Code className="size-4" />
        </BotaoBarra>
        <span className="mx-1 h-5 w-px bg-border" />
        <BotaoBarra
          titulo="Lista com marcadores"
          ativo={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="size-4" />
        </BotaoBarra>
        <BotaoBarra
          titulo="Lista numerada"
          ativo={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="size-4" />
        </BotaoBarra>
        <BotaoBarra
          titulo="Citação"
          ativo={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="size-4" />
        </BotaoBarra>
        <BotaoBarra
          titulo="Linha divisória"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <Minus className="size-4" />
        </BotaoBarra>
        <BotaoBarra
          titulo="Bloco de código"
          ativo={editor.isActive("codeBlock")}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        >
          <Square className="size-4" />
        </BotaoBarra>
        <span className="mx-1 h-5 w-px bg-border" />
        <BotaoBarra titulo="Link (Ctrl+K)" ativo={editor.isActive("link")} onClick={abrirLink}>
          <Link2 className="size-4" />
        </BotaoBarra>
        <BotaoBarra
          titulo="Remover link"
          onClick={() => editor.chain().focus().extendMarkRange("link").unsetLink().run()}
        >
          <Link2Off className="size-4" />
        </BotaoBarra>
        <BotaoBarra titulo="Imagem" onClick={() => setDialogoImagem(true)}>
          <ImageIcon className="size-4" />
        </BotaoBarra>
        <BotaoBarra titulo="Embed (YouTube, Instagram, Spotify)" onClick={() => setDialogoEmbed(true)}>
          <Youtube className="size-4" />
        </BotaoBarra>
        <span className="mx-1 h-5 w-px bg-border" />
        <BotaoBarra titulo="Desfazer" onClick={() => editor.chain().focus().undo().run()}>
          <Undo2 className="size-4" />
        </BotaoBarra>
        <BotaoBarra titulo="Refazer" onClick={() => editor.chain().focus().redo().run()}>
          <Redo2 className="size-4" />
        </BotaoBarra>
      </div>

      <EditorContent editor={editor} style={{ minHeight: minAltura }} className="px-4 py-3" />

      <Dialog open={dialogoLink} onOpenChange={setDialogoLink}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Inserir link</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="link-url">URL</Label>
              <Input
                id="link-url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://"
              />
            </div>
            <div>
              <Label htmlFor="link-texto">Texto</Label>
              <Input
                id="link-texto"
                value={linkTexto}
                onChange={(e) => setLinkTexto(e.target.value)}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={linkNovaAba}
                onCheckedChange={(v) => setLinkNovaAba(v === true)}
              />
              Abrir em nova aba
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogoLink(false)}>
              Cancelar
            </Button>
            <Button onClick={() => aplicarLink(editor)}>Aplicar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogoImagem} onOpenChange={setDialogoImagem}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Inserir imagem</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => setImgArquivo(e.target.files?.[0] ?? null)}
            />
            <div>
              <Label htmlFor="img-alt">Texto alternativo (obrigatório)</Label>
              <Input id="img-alt" value={imgAlt} onChange={(e) => setImgAlt(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="img-legenda">Legenda (opcional)</Label>
              <Input
                id="img-legenda"
                value={imgLegenda}
                onChange={(e) => setImgLegenda(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              {(["left", "center", "full"] as const).map((a) => (
                <Button
                  key={a}
                  type="button"
                  size="sm"
                  variant={imgAlign === a ? "default" : "outline"}
                  onClick={() => setImgAlign(a)}
                >
                  {a === "left" ? "Esquerda" : a === "center" ? "Centro" : "Largura total"}
                </Button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogoImagem(false)}>
              Cancelar
            </Button>
            <Button onClick={inserirImagem} disabled={enviando}>
              {enviando ? "Enviando…" : "Inserir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogoEmbed} onOpenChange={setDialogoEmbed}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Inserir embed</DialogTitle>
          </DialogHeader>
          <Input
            value={embedUrl}
            onChange={(e) => setEmbedUrl(e.target.value)}
            placeholder="URL do YouTube, Instagram ou Spotify"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogoEmbed(false)}>
              Cancelar
            </Button>
            <Button onClick={inserirEmbed}>Inserir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
